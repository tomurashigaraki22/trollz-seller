import { ensureBannerAdTables } from "@/lib/banner-ads";
import { query } from "@/lib/db";
import { withAdminPermission, jsonBadRequest, jsonOk } from "@/lib/admin-api";
import { writeAuditLog, requestId } from "@/lib/admin-audit";
import { PERMISSIONS } from "@/lib/rbac";

const PLAN_CODES = new Set(["monthly", "quarterly", "yearly"]);

export async function GET(request) {
  return withAdminPermission(request, PERMISSIONS.HOMEPAGE_MANAGE, async () => {
    await ensureBannerAdTables();
    const plans = await query("SELECT code, name, duration_days, price, is_active FROM seller_banner_ad_plans ORDER BY duration_days");
    const ads = await query(
      `SELECT a.*, u.name AS seller_name, u.email AS seller_email, p.name AS plan_name
       FROM seller_banner_ads a
       LEFT JOIN users u ON u.id = a.seller_id
       LEFT JOIN seller_banner_ad_plans p ON p.code = a.plan_code
       ORDER BY a.created_at DESC, a.id DESC`
    );
    return jsonOk({ plans, ads });
  });
}

export async function PATCH(request) {
  return withAdminPermission(request, PERMISSIONS.HOMEPAGE_MANAGE, async (context) => {
    await ensureBannerAdTables();
    const body = await request.json().catch(() => null);
    const plans = Array.isArray(body?.plans) ? body.plans : [];
    if (!plans.length) return jsonBadRequest("Provide at least one advertising plan.");

    const before = await query("SELECT code, name, duration_days, price, is_active FROM seller_banner_ad_plans ORDER BY duration_days");
    for (const plan of plans) {
      const code = String(plan?.code || "").trim().toLowerCase();
      const price = Number(plan?.price);
      if (!PLAN_CODES.has(code) || !Number.isFinite(price) || price < 0 || price > 100000000) {
        return jsonBadRequest("Each plan must have a valid monthly, quarterly, or yearly price.");
      }
      await query("UPDATE seller_banner_ad_plans SET price = ?, is_active = 1 WHERE code = ?", [price, code]);
    }
    const after = await query("SELECT code, name, duration_days, price, is_active FROM seller_banner_ad_plans ORDER BY duration_days");
    await writeAuditLog({
      actorId: context.principal.id,
      action: "seller_banner_ad.pricing_updated",
      permissionCode: PERMISSIONS.HOMEPAGE_MANAGE,
      resourceType: "seller_banner_ad_plan",
      before,
      after,
      requestId: requestId(request),
    });
    return jsonOk({ plans: after });
  });
}

