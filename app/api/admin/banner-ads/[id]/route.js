import { ensureBannerAdTables } from "@/lib/banner-ads";
import { query } from "@/lib/db";
import { withAdminPermission, jsonBadRequest, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

const ALLOWED_STATUSES = new Set(["active", "paused", "rejected"]);

export async function PATCH(request, routeContext) {
  return withAdminPermission(request, PERMISSIONS.HOMEPAGE_MANAGE, async (context) => {
    await ensureBannerAdTables();
    const { id } = await routeContext.params;
    const beforeRows = await query("SELECT * FROM seller_banner_ads WHERE id = ? LIMIT 1", [id]);
    if (!beforeRows[0]) return new Response(JSON.stringify({ ok: false, error: "Banner ad not found." }), { status: 404, headers: { "content-type": "application/json" } });
    const status = String((await request.json().catch(() => null))?.status || "").toLowerCase();
    if (!ALLOWED_STATUSES.has(status)) return jsonBadRequest("Status must be active, paused, or rejected.");
    if (status === "active" && (beforeRows[0].payment_status !== "paid" || !beforeRows[0].expires_at || new Date(beforeRows[0].expires_at) <= new Date())) {
      return jsonBadRequest("Only a paid, unexpired banner ad can be activated.");
    }
    await query("UPDATE seller_banner_ads SET status = ? WHERE id = ?", [status, id]);
    const afterRows = await query("SELECT * FROM seller_banner_ads WHERE id = ? LIMIT 1", [id]);
    await writeAuditLog({
      actorId: context.principal.id,
      action: "seller_banner_ad.status_updated",
      permissionCode: PERMISSIONS.HOMEPAGE_MANAGE,
      resourceType: "seller_banner_ad",
      resourceId: id,
      sellerId: afterRows[0]?.seller_id || null,
      before: beforeRows[0],
      after: afterRows[0],
      requestId: requestId(request),
    });
    return jsonOk({ ad: afterRows[0] });
  });
}

