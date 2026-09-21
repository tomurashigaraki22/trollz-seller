import { NextResponse } from "next/server";
import { destroyAdminSession, getAdminContext, getRequestMetadata } from "@/lib/admin-session";
import { requestId, safeWriteAuditLog } from "@/lib/admin-audit";

export async function POST(request) {
  try {
    const context = await getAdminContext();
    const metadata = getRequestMetadata(request);
    await destroyAdminSession();
    await safeWriteAuditLog({ actorId: context?.principal?.id || null, action: 'admin.logout', requestId: requestId(request), ipHash: metadata.ipHash, userAgent: metadata.userAgent });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin logout failed:", error);
    return NextResponse.json({ ok: false, error: "Could not sign out right now." }, { status: 500 });
  }
}
