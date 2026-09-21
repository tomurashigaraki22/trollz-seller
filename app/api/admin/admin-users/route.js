import { getAdminUsers } from "@/lib/admin-data";
import { getAdminRoles } from "@/lib/admin-data";
import { withAdminPermission, jsonOk } from "@/lib/admin-api";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request) {
  return withAdminPermission(request, PERMISSIONS.ADMIN_USERS_READ, async () => {
    const [users, roles] = await Promise.all([getAdminUsers(), getAdminRoles()]);
    return jsonOk({ users, roles });
  });
}
