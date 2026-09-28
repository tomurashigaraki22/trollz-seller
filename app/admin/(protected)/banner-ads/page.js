import { requireAdminContext } from "@/lib/admin-session";
import { getAdminBannerAdDashboard } from "@/lib/banner-ads";
import { PERMISSIONS } from "@/lib/rbac";
import AdminBannerAdsManager from "@/components/admin/AdminBannerAdsManager";

export const dynamic = "force-dynamic";

export default async function AdminBannerAdsPage() {
  await requireAdminContext(PERMISSIONS.HOMEPAGE_MANAGE);
  const data = await getAdminBannerAdDashboard();
  return <AdminBannerAdsManager {...data} />;
}

