import "server-only";

import { query } from "@/lib/db";

function serializeValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  return value;
}

export function serializeRows(rows) {
  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, serializeValue(value)]))
  );
}

export async function getAdminDashboardStats() {
  const [products, sellers, applications, orders, admins] = await Promise.all([
    query("SELECT COUNT(*) AS count FROM product"),
    query("SELECT COUNT(*) AS count FROM users WHERE role = 'Seller'"),
    query("SELECT COUNT(*) AS count FROM seller_applications WHERE verification_status = 'pending'"),
    query("SELECT COUNT(*) AS count FROM seller_orders"),
    query("SELECT COUNT(DISTINCT user_id) AS count FROM admin_memberships WHERE status = 'active'"),
  ]);

  return {
    products: Number(products[0]?.count || 0),
    sellers: Number(sellers[0]?.count || 0),
    pendingApplications: Number(applications[0]?.count || 0),
    orders: Number(orders[0]?.count || 0),
    admins: Number(admins[0]?.count || 0),
  };
}

export async function getAdminProducts({ limit = 100 } = {}) {
  const rows = await query(
    `SELECT id, item, category, subcategory, price, discount, qty, stock, supplier,
            is_flash_sale, date, views
     FROM product
     ORDER BY id DESC
     LIMIT ?`,
    [limit]
  );
  return serializeRows(rows);
}

export async function getAdminSellers({ limit = 100 } = {}) {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.status,
            (SELECT COUNT(*) FROM seller_products sp WHERE sp.seller_id = u.id) AS product_count,
            (SELECT COUNT(*) FROM seller_orders so WHERE so.seller_id = u.id) AS order_count
     FROM users u
     WHERE u.role = 'Seller'
     ORDER BY u.id DESC
     LIMIT ?`,
    [limit]
  );
  return serializeRows(rows);
}

export async function getAdminSellerApplications({ limit = 100 } = {}) {
  const rows = await query(
    `SELECT id, full_name, email, business_name, primary_category,
            verification_status, agreement_accepted, signature_name, submitted_at,
            verified_by, verification_date, remarks
     FROM seller_applications
     ORDER BY submitted_at DESC, id DESC
     LIMIT ?`,
    [limit]
  );
  return serializeRows(rows);
}

export async function getAdminOrders({ limit = 100 } = {}) {
  const rows = await query(
    `SELECT id, seller_id, order_number, buyer_name, buyer_email, total_amount,
            order_status, payment_status, city, delivery_city, created_at, updated_at
     FROM seller_orders
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [limit]
  );
  return serializeRows(rows);
}

export async function getAdminRoles() {
  const rows = await query(
    `SELECT r.id, r.code, r.name, r.description, r.is_system, r.is_active,
            COUNT(DISTINCT rp.permission_id) AS permission_count,
            COUNT(DISTINCT m.user_id) AS member_count
     FROM admin_roles r
     LEFT JOIN admin_role_permissions rp ON rp.role_id = r.id
     LEFT JOIN admin_memberships m ON m.role_id = r.id AND m.status = 'active'
     GROUP BY r.id, r.code, r.name, r.description, r.is_system, r.is_active
     ORDER BY r.is_system DESC, r.name ASC`
  );
  return serializeRows(rows);
}

export async function getAdminUsers() {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.status,
            GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS roles,
            COUNT(DISTINCT active_m.id) AS membership_count,
            MAX(active_m.id IS NOT NULL) AS admin_active
     FROM users u
     JOIN admin_memberships any_m ON any_m.user_id = u.id
     LEFT JOIN admin_memberships active_m ON active_m.user_id = u.id AND active_m.status = 'active'
     LEFT JOIN admin_roles r ON r.id = active_m.role_id AND r.is_active = 1
     GROUP BY u.id, u.name, u.email, u.status
     ORDER BY u.name ASC, u.id ASC`
  );
  return serializeRows(rows).map((row) => ({
    ...row,
    roles: String(row.roles || '').split(',').filter(Boolean),
  }));
}

export async function getAdminAuditLogs({ limit = 100 } = {}) {
  const rows = await query(
    `SELECT a.id, a.actor_id, u.name AS actor_name, u.email AS actor_email,
            a.action, a.permission_code, a.resource_type, a.resource_id,
            a.seller_id, a.request_id, a.created_at
     FROM admin_audit_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT ?`,
    [limit]
  );
  return serializeRows(rows);
}
