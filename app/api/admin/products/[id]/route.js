import { query } from "@/lib/db";
import { withAdminPermission, jsonBadRequest, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

async function getProduct(id) {
  const rows = await query("SELECT * FROM product WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

export async function PATCH(request, routeContext) {
  return withAdminPermission(request, PERMISSIONS.PRODUCTS_UPDATE, async (context) => {
    const { id } = await routeContext.params;
    const before = await getProduct(id);
    if (!before) return new Response(JSON.stringify({ ok: false, error: 'Product not found.' }), { status: 404, headers: { 'content-type': 'application/json' } });
    const body = await request.json();
    const allowed = ['item', 'category', 'subcategory', 'price', 'discount', 'qty', 'stock', 'supplier', 'new', 'description', 'img', 'color_options', 'size_type', 'size_options', 'attributes', 'is_flash_sale'];
    const fields = allowed.filter((field) => Object.prototype.hasOwnProperty.call(body || {}, field));
    if (!fields.length) return jsonBadRequest('No editable product fields supplied.');
    const values = fields.map((field) => field === 'is_flash_sale' ? (body[field] ? 1 : 0) : body[field]);
    await query(`UPDATE product SET ${fields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE id = ?`, [...values, id]);
    const after = await getProduct(id);
    await writeAuditLog({ actorId: context.principal.id, action: 'product.updated', permissionCode: PERMISSIONS.PRODUCTS_UPDATE, resourceType: 'product', resourceId: id, before, after, requestId: requestId(request) });
    return new Response(JSON.stringify({ ok: true, product: after }), { headers: { 'content-type': 'application/json' } });
  });
}

export async function DELETE(request, routeContext) {
  return withAdminPermission(request, PERMISSIONS.PRODUCTS_DELETE, async (context) => {
    const { id } = await routeContext.params;
    const before = await getProduct(id);
    if (!before) return new Response(JSON.stringify({ ok: false, error: 'Product not found.' }), { status: 404, headers: { 'content-type': 'application/json' } });
    await query("DELETE FROM product WHERE id = ?", [id]);
    await writeAuditLog({ actorId: context.principal.id, action: 'product.deleted', permissionCode: PERMISSIONS.PRODUCTS_DELETE, resourceType: 'product', resourceId: id, before, requestId: requestId(request) });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  });
}
