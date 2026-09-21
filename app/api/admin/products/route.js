import { query } from "@/lib/db";
import { getAdminProducts } from "@/lib/admin-data";
import { withAdminPermission, jsonBadRequest, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request) {
  return withAdminPermission(request, PERMISSIONS.PRODUCTS_READ, async () => {
    const products = await getAdminProducts();
    return jsonOk({ products });
  });
}

export async function POST(request) {
  return withAdminPermission(request, PERMISSIONS.PRODUCTS_CREATE, async (context) => {
    const body = await request.json();
    const item = String(body?.item || '').trim();
    const category = String(body?.category || '').trim();
    const subcategory = String(body?.subcategory || '').trim();
    const price = Number(body?.price);
    const categoryId = Number(body?.category_id || 0);
    const qty = Number(body?.qty || 0);
    if (!item || !category || !subcategory || !Number.isFinite(price) || !Number.isFinite(categoryId)) {
      return jsonBadRequest("Item, category, subcategory, price, and category_id are required.");
    }
    const result = await query(
      `INSERT INTO product
       (item, category, subcategory, price, discount, category_id, supplier, new, qty, stock,
        description, img, color_options, size_type, size_options, attributes, is_flash_sale)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item, category, subcategory, price, Number(body?.discount || 0), categoryId,
        String(body?.supplier || 'Trollz').slice(0, 50), String(body?.new || 'yes').slice(0, 10),
        qty, Number(body?.stock ?? qty), body?.description || null, body?.img || null,
        body?.color_options || null, body?.size_type || 'none', body?.size_options || null,
        body?.attributes || null, body?.is_flash_sale ? 1 : 0,
      ]
    );
    const after = { id: result.insertId, item, category, subcategory, price };
    await writeAuditLog({ actorId: context.principal.id, action: 'product.created', permissionCode: PERMISSIONS.PRODUCTS_CREATE, resourceType: 'product', resourceId: result.insertId, after, requestId: requestId(request) });
    return jsonOk({ product: after });
  });
}
