import { getAdminSellers } from "@/lib/admin-data";
import { withAdminPermission, jsonOk } from "@/lib/admin-api";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request) {
  return withAdminPermission(request, PERMISSIONS.SELLERS_READ, async () => jsonOk({ sellers: await getAdminSellers() }));
}
