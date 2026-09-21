import { getAdminRoles } from "@/lib/admin-data";
import { getPermissionRegistry, createCustomRole } from "@/lib/admin-management";
import { withAdminPermission, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request) {
  return withAdminPermission(request, PERMISSIONS.ADMIN_ROLES_READ, async () => {
    const [roles, permissions] = await Promise.all([getAdminRoles(), getPermissionRegistry()]);
    return jsonOk({ roles, permissions });
  });
}

export async function POST(request) {
  return withAdminPermission(request, PERMISSIONS.ADMIN_ROLES_MANAGE, async (context) => {
    const body = await request.json();
    if (!String(body?.reason || '').trim()) return new Response(JSON.stringify({ ok: false, error: 'A reason is required for role changes.' }), { status: 400, headers: { 'content-type': 'application/json' } });
    const role = await createCustomRole({ actor: context.principal, ...body });
    await writeAuditLog({ actorId: context.principal.id, action: 'admin_role.created', permissionCode: PERMISSIONS.ADMIN_ROLES_MANAGE, resourceType: 'admin_role', resourceId: role.id, after: { ...role, reason: body.reason }, requestId: requestId(request) });
    return jsonOk({ role });
  });
}
