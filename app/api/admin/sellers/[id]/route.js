import { query } from "@/lib/db";
import { withAdminPermission, jsonBadRequest, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request, routeContext) {
  return withAdminPermission(request, PERMISSIONS.SELLERS_MANAGE, async (context) => {
    const { id } = await routeContext.params;
    const beforeRows = await query("SELECT id, name, email, phone, status FROM users WHERE id = ? AND role = 'Seller' LIMIT 1", [id]);
    if (!beforeRows[0]) return new Response(JSON.stringify({ ok: false, error: 'Seller not found.' }), { status: 404, headers: { 'content-type': 'application/json' } });
    const applicationRows = await query(
      `SELECT * FROM seller_applications
       WHERE seller_user_id = ? OR (seller_user_id IS NULL AND LOWER(email) = LOWER(?))
       ORDER BY id DESC LIMIT 1`,
      [id, beforeRows[0].email]
    );
    const body = await request.json();
    const status = Number(body?.status);
    if (![0, 1].includes(status)) return jsonBadRequest('Seller status must be 0 or 1.');

    if (status === 1 && Number(beforeRows[0].status) === 0 && applicationRows[0]?.verification_status !== 'approved') {
      return new Response(JSON.stringify({ ok: false, error: 'This seller must complete onboarding and receive approval before activation.' }), {
        status: 409,
        headers: { 'content-type': 'application/json' },
      });
    }

    await query("UPDATE users SET status = ? WHERE id = ? AND role = 'Seller'", [status, id]);
    if (status === 0 && applicationRows[0]) {
      await query(
        `UPDATE seller_applications
         SET seller_user_id = ?, verification_status = 'rejected',
             remarks = ?, verified_by = ?, verification_date = UTC_TIMESTAMP()
         WHERE id = ?`,
        [id, 'Seller account deactivated. Please submit onboarding again for review.', context.principal.email, applicationRows[0].id]
      );
    }
    const afterRows = await query("SELECT id, name, email, phone, status FROM users WHERE id = ? LIMIT 1", [id]);
    const afterApplicationRows = applicationRows[0]
      ? await query("SELECT * FROM seller_applications WHERE id = ? LIMIT 1", [applicationRows[0].id])
      : [];
    await writeAuditLog({
      actorId: context.principal.id,
      action: status === 0 ? 'seller.deactivated' : 'seller.activated',
      permissionCode: PERMISSIONS.SELLERS_MANAGE,
      resourceType: 'seller',
      resourceId: id,
      sellerId: id,
      before: { seller: beforeRows[0], application: applicationRows[0] || null },
      after: { seller: afterRows[0], application: afterApplicationRows[0] || applicationRows[0] || null },
      requestId: requestId(request),
    });
    return jsonOk({ seller: afterRows[0] });
  });
}
