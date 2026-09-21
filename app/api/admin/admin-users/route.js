import { getAdminUsers } from "@/lib/admin-data";
import { getAdminRoles } from "@/lib/admin-data";
import { createAdminUser } from "@/lib/admin-management";
import { withAdminPermission, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request) {
  return withAdminPermission(request, PERMISSIONS.ADMIN_USERS_READ, async () => {
    const [users, roles] = await Promise.all([getAdminUsers(), getAdminRoles()]);
    return jsonOk({ users, roles });
  });
}

export async function POST(request) {
  return withAdminPermission(request, PERMISSIONS.ADMIN_USERS_MANAGE, async (context) => {
    const body = await request.json();
    if (!String(body?.reason || '').trim()) {
      const error = new Error('A reason is required when creating an admin account.');
      error.status = 400;
      throw error;
    }
    const user = await createAdminUser({ actor: context.principal, ...body });
    await writeAuditLog({
      actorId: context.principal.id,
      action: 'admin_user.created',
      permissionCode: PERMISSIONS.ADMIN_USERS_MANAGE,
      resourceType: 'admin_user',
      resourceId: user.id,
      after: { ...user, reason: body.reason },
      requestId: requestId(request),
    });
    return jsonOk({ user });
  });
}
