import { query } from "@/lib/db";
import { withAdminPermission, jsonBadRequest, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

export async function PATCH(request, routeContext) {
  return withAdminPermission(request, PERMISSIONS.SELLER_APPLICATIONS_REVIEW, async (context) => {
    const { id } = await routeContext.params;
    const beforeRows = await query("SELECT * FROM seller_applications WHERE id = ? LIMIT 1", [id]);
    if (!beforeRows[0]) return new Response(JSON.stringify({ ok: false, error: 'Application not found.' }), { status: 404, headers: { 'content-type': 'application/json' } });
    const body = await request.json();
    const status = String(body?.verification_status || '').toLowerCase();
    if (!['pending', 'approved', 'rejected'].includes(status)) return jsonBadRequest('Application status must be pending, approved, or rejected.');
    const remarks = body?.remarks == null ? beforeRows[0].remarks : String(body.remarks).trim();
    await query(
      `UPDATE seller_applications
       SET verification_status = ?, remarks = ?, verified_by = ?, verification_date = ${status === 'pending' ? 'NULL' : 'UTC_TIMESTAMP()'}
       WHERE id = ?`,
      [status, remarks || null, status === 'pending' ? null : context.principal.email, id]
    );
    const afterRows = await query("SELECT * FROM seller_applications WHERE id = ? LIMIT 1", [id]);
    await writeAuditLog({ actorId: context.principal.id, action: 'seller_application.reviewed', permissionCode: PERMISSIONS.SELLER_APPLICATIONS_REVIEW, resourceType: 'seller_application', resourceId: id, sellerId: afterRows[0]?.seller_user_id || null, before: beforeRows[0], after: afterRows[0], requestId: requestId(request) });
    return jsonOk({ application: afterRows[0] });
  });
}
