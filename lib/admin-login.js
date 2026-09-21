import "server-only";

import crypto from "crypto";
import { query } from "@/lib/db";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export function loginBucketKey(email, ipHash) {
  return crypto
    .createHash("sha256")
    .update(`${String(email || "").trim().toLowerCase()}:${ipHash || "unknown"}`)
    .digest("hex");
}

export async function isLoginRateLimited(bucketKey) {
  const rows = await query(
    `SELECT attempts, window_started_at, locked_until FROM admin_login_attempts
     WHERE bucket_key = ? LIMIT 1`,
    [bucketKey]
  );
  const row = rows[0];
  if (!row) return false;
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) return true;
  if (new Date(row.window_started_at).getTime() <= Date.now() - WINDOW_MINUTES * 60 * 1000) return false;
  return row.attempts >= MAX_ATTEMPTS;
}

export async function recordLoginFailure(bucketKey) {
  await query(
    `INSERT INTO admin_login_attempts
       (bucket_key, attempts, window_started_at, locked_until)
     VALUES (?, 1, UTC_TIMESTAMP(), NULL)
     ON DUPLICATE KEY UPDATE
       attempts = IF(
         window_started_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${WINDOW_MINUTES} MINUTE),
         1,
         attempts + 1
       ),
       window_started_at = IF(
         window_started_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${WINDOW_MINUTES} MINUTE),
         UTC_TIMESTAMP(),
         window_started_at
       ),
       locked_until = IF(
         window_started_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${WINDOW_MINUTES} MINUTE)
         AND attempts >= ${MAX_ATTEMPTS},
         DATE_ADD(UTC_TIMESTAMP(), INTERVAL ${WINDOW_MINUTES} MINUTE),
         locked_until
       )`,
    [bucketKey]
  );
}

export async function clearLoginFailures(bucketKey) {
  await query("DELETE FROM admin_login_attempts WHERE bucket_key = ?", [bucketKey]);
}
