import { getAdminUserById, replaceAdminUserRoles, updateAdminUserStatus } from "@/lib/admin-management";
import { withAdminPermission, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request, routeContext) {
  return withAdminPermission(request, PERMISSIONS.ADMIN_USERS_MANAGE, async (context) => {
    const { id } = await routeContext.params;
    const body = await request.json();
    if (!String(body?.reason || '').trim()) {
      const error = new Error('A reason is required for admin access changes.');
      error.status = 400;
      throw error;
    }
    const before = await getAdminUserById(id);
    if (!before) {
      const error = new Error('Admin user not found.');
      error.status = 404;
      throw error;
    }
    let after;
    let action;
    if (Array.isArray(body?.roleCodes)) {
      const result = await replaceAdminUserRoles({ actor: context.principal, userId: id, roleCodes: body.roleCodes });
      after = { ...before, roles: result.after, reason: body.reason };
      action = 'admin_user.roles_updated';
    } else if (Object.prototype.hasOwnProperty.call(body || {}, 'status')) {
      const result = await updateAdminUserStatus({ actor: context.principal, userId: id, status: body.status });
      after = { ...before, admin_active: result.after.admin_active, reason: body.reason };
      action = 'admin_user.status_updated';
    } else {
      const error = new Error('Provide roleCodes or status.');
      error.status = 400;
      throw error;
    }
    await writeAuditLog({ actorId: context.principal.id, action, permissionCode: PERMISSIONS.ADMIN_USERS_MANAGE, resourceType: 'admin_user', resourceId: id, before, after, requestId: requestId(request) });
    return jsonOk({ user: after });
  });
}
