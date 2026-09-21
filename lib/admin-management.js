import "server-only";

import bcrypt from "bcryptjs";
import { query, transaction } from "@/lib/db";

function cleanRoleCodes(roleCodes) {
  return [...new Set((Array.isArray(roleCodes) ? roleCodes : []).map((code) => String(code).trim()).filter(Boolean))];
}

function cleanPermissionCodes(permissionCodes) {
  return [...new Set((Array.isArray(permissionCodes) ? permissionCodes : []).map((code) => String(code).trim()).filter(Boolean))];
}

function isSuperAdmin(actor) {
  return Boolean(actor?.roles?.includes('super_admin') || actor?.permissions?.has('*'));
}

function reject(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export async function getPermissionRegistry() {
  return query(
    `SELECT id, code, resource, action, description
     FROM permissions ORDER BY resource ASC, action ASC, code ASC`
  );
}

export async function getAdminUserById(userId) {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.status, u.role,
            GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS role_codes,
            MAX(m.id IS NOT NULL) AS admin_active
     FROM users u
     JOIN admin_memberships any_m ON any_m.user_id = u.id
     LEFT JOIN admin_memberships m ON m.user_id = u.id AND m.status = 'active'
     LEFT JOIN admin_roles r ON r.id = m.role_id AND r.is_active = 1
     WHERE u.id = ? AND u.role = 'Admin'
     GROUP BY u.id, u.name, u.email, u.status, u.role
     LIMIT 1`,
    [userId]
  );
  const row = rows[0];
  if (!row) return null;
  return { ...row, roles: String(row.role_codes || '').split(',').filter(Boolean) };
}

export async function getRoleById(roleId) {
  const rows = await query(
    `SELECT r.id, r.code, r.name, r.description, r.is_system, r.is_active,
            GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ',') AS permission_codes
     FROM admin_roles r
     LEFT JOIN admin_role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE r.id = ?
     GROUP BY r.id, r.code, r.name, r.description, r.is_system, r.is_active
     LIMIT 1`,
    [roleId]
  );
  const row = rows[0];
  if (!row) return null;
  return { ...row, permissions: String(row.permission_codes || '').split(',').filter(Boolean) };
}

async function assertAssignablePermissions(connection, actor, permissionCodes) {
  const codes = cleanPermissionCodes(permissionCodes);
  if (actor.permissions.has('*')) return codes;
  const allowed = new Set(actor.permissions);
  const forbidden = codes.filter((code) => !allowed.has(code));
  if (forbidden.length) {
    const error = new Error("You cannot grant permissions you do not possess.");
    error.status = 403;
    throw error;
  }
  return codes;
}

async function getActiveRolesByCodes(roleCodes) {
  const codes = cleanRoleCodes(roleCodes);
  const roles = await query(
    `SELECT r.id, r.code, GROUP_CONCAT(DISTINCT p.code SEPARATOR ',') AS permission_codes
     FROM admin_roles r
     LEFT JOIN admin_role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE r.code IN (?) AND r.is_active = 1
     GROUP BY r.id, r.code`,
    [codes]
  );
  if (roles.length !== codes.length) reject("One or more roles are invalid.");
  return { codes, roles };
}

async function assertTargetProtection(actor, userId, roleCodes, connection = null) {
  const superAdmin = isSuperAdmin(actor);
  if (!superAdmin && Number(userId) === Number(actor.id)) {
    reject("You cannot change your own administrator access.", 403);
  }
  if (!superAdmin && cleanRoleCodes(roleCodes).includes('super_admin')) {
    reject("Only a super administrator can grant super-admin access.", 403);
  }
  const sql = `SELECT COUNT(*) AS count FROM admin_memberships m
     JOIN admin_roles r ON r.id = m.role_id
     WHERE m.user_id = ? AND m.status = 'active' AND r.code = 'super_admin'`;
  const rows = connection
    ? (await connection.query(sql, [userId]))[0]
    : await query(sql, [userId]);
  if (!superAdmin && Number(rows[0]?.count || 0) > 0) {
    reject("Only a super administrator can change a super administrator.", 403);
  }
}

export async function createAdminUser({ actor, name, email, password, phone, roleCodes }) {
  const safeName = String(name || '').trim();
  const safeEmail = String(email || '').trim().toLowerCase();
  const safePhone = String(phone || '').trim();
  const safePassword = String(password || '');
  if (safeName.length < 2 || safeName.length > 50) reject("Name must be between 2 and 50 characters.");
  if (!/^\S+@\S+\.\S+$/.test(safeEmail) || safeEmail.length > 50) reject("A valid email address is required.");
  if (safePassword.length < 12 || safePassword.length > 200) reject("Password must be between 12 and 200 characters.");
  const { codes, roles } = await getActiveRolesByCodes(roleCodes);
  if (!isSuperAdmin(actor) && codes.includes('super_admin')) reject("Only a super administrator can grant super-admin access.", 403);
  const targetPermissions = new Set(roles.flatMap((role) => String(role.permission_codes || '').split(',').filter(Boolean)));
  await assertAssignablePermissions(null, actor, [...targetPermissions]);
  const passwordHash = await bcrypt.hash(safePassword, 12);

  const userId = await transaction(async (connection) => {
    const [existing] = await connection.query("SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [safeEmail]);
    if (existing.length) reject("An account with that email already exists.", 409);
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, phone, password, role, status)
       VALUES (?, ?, ?, ?, 'Admin', 0)`,
      [safeName, safeEmail, safePhone, passwordHash]
    );
    for (const role of roles) {
      await connection.query(
        `INSERT INTO admin_memberships (user_id, role_id, seller_id, status, created_by)
         VALUES (?, ?, 0, 'active', ?)
         ON DUPLICATE KEY UPDATE status = 'active', created_by = VALUES(created_by)`,
        [userResult.insertId, role.id, actor.id]
      );
    }
    return userResult.insertId;
  });
  return { id: userId, name: safeName, email: safeEmail, phone: safePhone, roles: codes, admin_active: 1 };
}

export async function createCustomRole({ actor, name, code, description, permissionCodes }) {
  const safeCode = String(code || '').trim().toLowerCase();
  const safeName = String(name || '').trim();
  if (!/^[a-z0-9_]{2,80}$/.test(safeCode) || !safeName) {
    const error = new Error("Role name and a lowercase role code are required.");
    error.status = 400;
    throw error;
  }
  const codes = await assertAssignablePermissions(null, actor, permissionCodes);

  const roleId = await transaction(async (connection) => {
    const [existing] = await connection.query("SELECT id FROM admin_roles WHERE code = ? LIMIT 1", [safeCode]);
    if (existing.length) {
      const error = new Error("That role code already exists.");
      error.status = 409;
      throw error;
    }
    const [roleResult] = await connection.query(
      `INSERT INTO admin_roles (code, name, description, is_system, is_active)
       VALUES (?, ?, ?, 0, 1)`,
      [safeCode, safeName, String(description || '').trim() || null]
    );
    if (codes.length) {
      const [permissions] = await connection.query(
        "SELECT id, code FROM permissions WHERE code IN (?)",
        [codes]
      );
      if (permissions.length !== codes.length) {
        const error = new Error("One or more permissions are invalid.");
        error.status = 400;
        throw error;
      }
      await connection.query(
        `INSERT INTO admin_role_permissions (role_id, permission_id)
         VALUES ${permissions.map(() => '(?, ?)').join(', ')}`,
        permissions.flatMap((permission) => [roleResult.insertId, permission.id])
      );
    }
    return roleResult.insertId;
  });
  return getRoleById(roleId);
}

export async function updateCustomRole({ actor, roleId, name, description, permissionCodes }) {
  const role = await getRoleById(roleId);
  if (!role) {
    const error = new Error("Role not found.");
    error.status = 404;
    throw error;
  }
  if (Number(role.is_system)) {
    const error = new Error("System roles cannot be edited.");
    error.status = 400;
    throw error;
  }
  const codes = await assertAssignablePermissions(null, actor, permissionCodes);
  await transaction(async (connection) => {
    await connection.query(
      "UPDATE admin_roles SET name = ?, description = ? WHERE id = ? AND is_system = 0",
      [String(name || '').trim() || role.name, String(description || '').trim() || null, roleId]
    );
    await connection.query("DELETE FROM admin_role_permissions WHERE role_id = ?", [roleId]);
    if (codes.length) {
      const [permissions] = await connection.query("SELECT id, code FROM permissions WHERE code IN (?)", [codes]);
      if (permissions.length !== codes.length) {
        const error = new Error("One or more permissions are invalid.");
        error.status = 400;
        throw error;
      }
      await connection.query(
        `INSERT INTO admin_role_permissions (role_id, permission_id)
         VALUES ${permissions.map(() => '(?, ?)').join(', ')}`,
        permissions.flatMap((permission) => [roleId, permission.id])
      );
    }
  });
  return getRoleById(roleId);
}

export async function replaceAdminUserRoles({ actor, userId, roleCodes }) {
  const codes = cleanRoleCodes(roleCodes);
  if (!codes.length) {
    const error = new Error("At least one role is required.");
    error.status = 400;
    throw error;
  }

  const roleResult = await getActiveRolesByCodes(codes);
  const roles = roleResult.roles;
  const targetPermissions = new Set(roles.flatMap((role) => String(role.permission_codes || '').split(',').filter(Boolean)));
  await assertAssignablePermissions(null, actor, [...targetPermissions]);

  return transaction(async (connection) => {
    const [targetRows] = await connection.query(
      `SELECT u.id, u.role FROM users u JOIN admin_memberships any_m ON any_m.user_id = u.id
       WHERE u.id = ? AND u.role = 'Admin' LIMIT 1`,
      [userId]
    );
    if (!targetRows.length) {
      const error = new Error("Admin user not found.");
      error.status = 404;
      throw error;
    }
    await assertTargetProtection(actor, userId, codes, connection);
    const [currentSuper] = await connection.query(
      `SELECT COUNT(*) AS count FROM admin_memberships m
       JOIN admin_roles r ON r.id = m.role_id
       WHERE r.code = 'super_admin' AND m.status = 'active'`
    );
    const [targetSuper] = await connection.query(
      `SELECT COUNT(*) AS count FROM admin_memberships m
       JOIN admin_roles r ON r.id = m.role_id
       WHERE m.user_id = ? AND r.code = 'super_admin' AND m.status = 'active'`,
      [userId]
    );
    if (Number(targetSuper[0]?.count || 0) > 0 && !codes.includes('super_admin') && Number(currentSuper[0]?.count || 0) <= 1) {
      const error = new Error("The final active super administrator cannot be demoted.");
      error.status = 400;
      throw error;
    }

    const [beforeRows] = await connection.query(
      `SELECT r.code FROM admin_memberships m JOIN admin_roles r ON r.id = m.role_id
       WHERE m.user_id = ? AND m.status = 'active' ORDER BY r.code`,
      [userId]
    );
    await connection.query("UPDATE admin_memberships SET status = 'revoked', updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'active'", [userId]);
    for (const role of roles) {
      await connection.query(
        `INSERT INTO admin_memberships (user_id, role_id, seller_id, status, created_by)
         VALUES (?, ?, 0, 'active', ?)
         ON DUPLICATE KEY UPDATE status = 'active', created_by = VALUES(created_by)`,
        [userId, role.id, actor.id]
      );
    }
    return {
      before: beforeRows.map((row) => row.code),
      after: codes,
    };
  });
}

export async function updateAdminUserStatus({ actor, userId, status }) {
  const nextStatus = Number(status);
  if (![0, 1].includes(nextStatus)) {
    const error = new Error("Status must be 0 or 1.");
    error.status = 400;
    throw error;
  }
  const target = await getAdminUserById(userId);
  if (!target) {
    const error = new Error("Admin user not found.");
    error.status = 404;
    throw error;
  }
  await assertTargetProtection(actor, userId, target.roles);
  const targetMembership = await query(
    `SELECT COUNT(*) AS count FROM admin_memberships m JOIN admin_roles r ON r.id = m.role_id
     WHERE m.user_id = ? AND m.status = 'active' AND r.code = 'super_admin'`,
    [userId]
  );
  if (Number(targetMembership[0]?.count || 0) > 0 && nextStatus === 0) {
    const activeSuperAdmins = await query(
      `SELECT COUNT(DISTINCT m.user_id) AS count FROM admin_memberships m
       JOIN admin_roles r ON r.id = m.role_id AND r.code = 'super_admin'
       WHERE m.status = 'active'`
    );
    if (Number(activeSuperAdmins[0]?.count || 0) <= 1) {
      const error = new Error("The final active super administrator cannot be deactivated.");
      error.status = 400;
      throw error;
    }
  }
  await query("UPDATE admin_memberships SET status = ? WHERE user_id = ?", [nextStatus === 1 ? 'active' : 'suspended', userId]);
  return { before: { admin_active: target.admin_active }, after: { admin_active: nextStatus === 1 ? 1 : 0 }, actorId: actor.id };
}
