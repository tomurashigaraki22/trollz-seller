import { query } from "@/lib/db";
import { withAdminPermission, jsonBadRequest, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request, routeContext) {
  return withAdminPermission(request, PERMISSIONS.ORDERS_UPDATE_STATUS, async (context) => {
    const { id } = await routeContext.params;
    const beforeRows = await query("SELECT * FROM seller_orders WHERE id = ? LIMIT 1", [id]);
    if (!beforeRows[0]) return new Response(JSON.stringify({ ok: false, error: 'Order not found.' }), { status: 404, headers: { 'content-type': 'application/json' } });
    const orderStatus = String((await request.json())?.order_status || '').toLowerCase();
    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) return jsonBadRequest('Invalid order status.');
    await query("UPDATE seller_orders SET order_status = ? WHERE id = ?", [orderStatus, id]);
    const afterRows = await query("SELECT * FROM seller_orders WHERE id = ? LIMIT 1", [id]);
    await writeAuditLog({ actorId: context.principal.id, action: 'order.status_updated', permissionCode: PERMISSIONS.ORDERS_UPDATE_STATUS, resourceType: 'seller_order', resourceId: id, sellerId: afterRows[0]?.seller_id || null, before: beforeRows[0], after: afterRows[0], requestId: requestId(request) });
    return jsonOk({ order: afterRows[0] });
  });
}
