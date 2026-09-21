import { query } from "@/lib/db";
import { withAdminPermission, jsonBadRequest, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request, routeContext) {
  return withAdminPermission(request, PERMISSIONS.SELLERS_MANAGE, async (context) => {
    const { id } = await routeContext.params;
    const beforeRows = await query("SELECT id, name, email, phone, status FROM users WHERE id = ? AND role = 'Seller' LIMIT 1", [id]);
    if (!beforeRows[0]) return new Response(JSON.stringify({ ok: false, error: 'Seller not found.' }), { status: 404, headers: { 'content-type': 'application/json' } });
    const body = await request.json();
    const status = Number(body?.status);
    if (![0, 1].includes(status)) return jsonBadRequest('Seller status must be 0 or 1.');
    await query("UPDATE users SET status = ? WHERE id = ? AND role = 'Seller'", [status, id]);
    const afterRows = await query("SELECT id, name, email, phone, status FROM users WHERE id = ? LIMIT 1", [id]);
    await writeAuditLog({ actorId: context.principal.id, action: 'seller.status_updated', permissionCode: PERMISSIONS.SELLERS_MANAGE, resourceType: 'seller', resourceId: id, sellerId: id, before: beforeRows[0], after: afterRows[0], requestId: requestId(request) });
    return jsonOk({ seller: afterRows[0] });
  });
}
