import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { query } from "@/lib/db";
import { getAdminPrincipalByUserId, requirePermission, serializePrincipal } from "@/lib/rbac";

const COOKIE_NAME = "trollz_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function sessionOptions() {
  const password = process.env.ADMIN_SESSION_PASSWORD;
  if (!password || password.length < 32) {
    throw new Error("ADMIN_SESSION_PASSWORD must be configured with at least 32 characters.");
  }

  return {
    password,
    cookieName: COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    },
  };
}

async function getSession() {
  return getIronSession(await cookies(), sessionOptions());
}

function hashValue(value) {
  const secret = process.env.ADMIN_SESSION_PASSWORD || "unconfigured-admin-session";
  return crypto.createHash("sha256").update(`${secret}:${value || "unknown"}`).digest("hex");
}

export function getRequestMetadata(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  return {
    ipHash: hashValue(ip),
    userAgent: (request.headers.get("user-agent") || "unknown").slice(0, 255),
  };
}

export async function createAdminSession(userId, metadata = {}) {
  const session = await getSession();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await query(
    `INSERT INTO admin_sessions
       (session_id, user_id, expires_at, ip_hash, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [sessionId, userId, expiresAt, metadata.ipHash || null, metadata.userAgent || null]
  );

  session.adminSessionId = sessionId;
  session.adminUserId = userId;
  await session.save();
  return sessionId;
}

export async function destroyAdminSession() {
  const session = await getSession();
  if (session.adminSessionId) {
    await query(
      "UPDATE admin_sessions SET revoked_at = UTC_TIMESTAMP() WHERE session_id = ? AND revoked_at IS NULL",
      [session.adminSessionId]
    );
  }
  session.destroy();
}

export async function getAdminContext() {
  const session = await getSession();
  if (!session.adminSessionId || !session.adminUserId) return null;

  const rows = await query(
    `SELECT session_id FROM admin_sessions
     WHERE session_id = ? AND user_id = ?
       AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP()
     LIMIT 1`,
    [session.adminSessionId, session.adminUserId]
  );
  if (rows.length === 0) {
    session.destroy();
    return null;
  }

  const principal = await getAdminPrincipalByUserId(session.adminUserId);
  if (!principal) {
    session.destroy();
    return null;
  }

  return { session, principal, admin: serializePrincipal(principal) };
}

export async function requireAdminContext(permission) {
  const context = await getAdminContext();
  if (!context) {
    const error = new Error("Admin authentication required.");
    error.status = 401;
    throw error;
  }
  if (permission) requirePermission(context.principal, permission);
  return context;
}
