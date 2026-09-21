import { getAdminAuditLogs } from "@/lib/admin-data";
import { withAdminPermission, jsonOk } from "@/lib/admin-api";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET(request) {
  return withAdminPermission(request, PERMISSIONS.AUDIT_LOGS_READ, async () => jsonOk({ logs: await getAdminAuditLogs() }));
}
