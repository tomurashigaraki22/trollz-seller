import "server-only";

import { NextResponse } from "next/server";
import { AuthorizationError } from "@/lib/rbac";
import { getAdminContext, getRequestMetadata } from "@/lib/admin-session";
import { requestId, safeWriteAuditLog } from "@/lib/admin-audit";

export async function withAdminPermission(request, permission, handler) {
  try {
    const context = await getAdminContext();
    if (!context) {
      const error = new Error("Admin authentication required.");
      error.status = 401;
      throw error;
    }
    if (!context.principal.permissions.has('*') && !context.principal.permissions.has(permission)) {
      const error = new AuthorizationError();
      error.status = 403;
      throw error;
    }
    return await handler(context);
  } catch (error) {
    const status = Number(error?.status) || (error instanceof AuthorizationError ? 403 : 500);
    const metadata = getRequestMetadata(request);
    const context = await getAdminContext().catch(() => null);
    await safeWriteAuditLog({
      actorId: context?.principal?.id || null,
      action: status === 403 ? 'admin.access_denied' : status === 401 ? 'admin.authentication_required' : 'admin.api_failed',
      permissionCode: permission,
      resourceType: 'admin_api',
      requestId: requestId(request),
      ipHash: metadata.ipHash,
      userAgent: metadata.userAgent,
    });
    if (status >= 500) console.error("Admin API error:", error);
    return NextResponse.json(
      { ok: false, error: status === 401 || status === 403 ? error.message : "Admin request failed." },
      { status }
    );
  }
}

export function jsonOk(data = {}) {
  return NextResponse.json({ ok: true, ...data });
}

export function jsonBadRequest(error) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
