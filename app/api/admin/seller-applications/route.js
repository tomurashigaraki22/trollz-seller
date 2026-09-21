import { getAdminSellerApplications } from "@/lib/admin-data";
import { withAdminPermission, jsonOk } from "@/lib/admin-api";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request) {
  return withAdminPermission(request, PERMISSIONS.SELLER_APPLICATIONS_READ, async () => jsonOk({ applications: await getAdminSellerApplications() }));
}
