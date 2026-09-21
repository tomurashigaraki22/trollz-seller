import { getRoleById, updateCustomRole } from "@/lib/admin-management";
import { withAdminPermission, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request, routeContext) {
  return withAdminPermission(request, PERMISSIONS.ADMIN_ROLES_MANAGE, async (context) => {
    const { id } = await routeContext.params;
    const body = await request.json();
    if (!String(body?.reason || '').trim()) return new Response(JSON.stringify({ ok: false, error: 'A reason is required for role changes.' }), { status: 400, headers: { 'content-type': 'application/json' } });
    const before = await getRoleById(id);
    const role = await updateCustomRole({ actor: context.principal, roleId: id, ...body });
    await writeAuditLog({ actorId: context.principal.id, action: 'admin_role.updated', permissionCode: PERMISSIONS.ADMIN_ROLES_MANAGE, resourceType: 'admin_role', resourceId: id, before, after: { ...role, reason: body.reason }, requestId: requestId(request) });
    return jsonOk({ role });
  });
}
