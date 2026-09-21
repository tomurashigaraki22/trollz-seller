import "server-only";

import crypto from "crypto";
import { query } from "@/lib/db";

export async function writeAuditLog({
  actorId,
  action,
  permissionCode = null,
  resourceType = null,
  resourceId = null,
  sellerId = null,
  before = null,
  after = null,
  requestId = null,
  ipHash = null,
  userAgent = null,
}) {
  await query(
    `INSERT INTO admin_audit_logs
       (actor_id, action, permission_code, resource_type, resource_id, seller_id,
        before_json, after_json, request_id, ip_hash, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      actorId,
      action,
      permissionCode,
      resourceType,
      resourceId == null ? null : String(resourceId),
      sellerId,
      before == null ? null : JSON.stringify(before),
      after == null ? null : JSON.stringify(after),
      requestId,
      ipHash,
      userAgent,
    ]
  );
}

export async function safeWriteAuditLog(payload) {
  try {
    await writeAuditLog(payload);
  } catch (error) {
    console.error("Admin audit write failed:", error);
  }
}

export function requestId(request) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}
