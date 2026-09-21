import { NextResponse } from "next/server";
import { findUserByEmail, verifyAndMigratePassword } from "@/lib/users";
import { getAdminPrincipalByUserId, serializePrincipal } from "@/lib/rbac";
import { createAdminSession, getRequestMetadata } from "@/lib/admin-session";
import {
  clearLoginFailures,
  isLoginRateLimited,
  loginBucketKey,
  recordLoginFailure,
} from "@/lib/admin-login";
import { safeWriteAuditLog, requestId } from "@/lib/admin-audit";

const INVALID_CREDENTIALS = "Incorrect admin email or password.";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const metadata = getRequestMetadata(request);
    const bucketKey = loginBucketKey(email, metadata.ipHash);

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: INVALID_CREDENTIALS }, { status: 401 });
    }
    if (await isLoginRateLimited(bucketKey)) {
      return NextResponse.json(
        { ok: false, error: "Too many login attempts. Try again later." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const user = await findUserByEmail(email);
    const principal = user ? await getAdminPrincipalByUserId(user.id) : null;
    const valid = user && principal ? await verifyAndMigratePassword(user, password) : false;

    if (!valid || !principal) {
      await recordLoginFailure(bucketKey);
      await safeWriteAuditLog({ action: 'admin.login.failed', requestId: requestId(request), ipHash: metadata.ipHash, userAgent: metadata.userAgent });
      return NextResponse.json({ ok: false, error: INVALID_CREDENTIALS }, { status: 401 });
    }

    await clearLoginFailures(bucketKey);
    await createAdminSession(user.id, metadata);
    await safeWriteAuditLog({ actorId: user.id, action: 'admin.login.succeeded', requestId: requestId(request), ipHash: metadata.ipHash, userAgent: metadata.userAgent });

    return NextResponse.json({ ok: true, admin: serializePrincipal(principal) });
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ ok: false, error: "Could not sign in right now." }, { status: 500 });
  }
}
