import "server-only";

import { query } from "@/lib/db";

export const PERMISSIONS = Object.freeze({
  DASHBOARD_READ: "dashboard.read",
  ANALYTICS_READ: "analytics.read",
  REPORTS_EXPORT: "reports.export",
  PRODUCTS_READ: "products.read",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",
  CATEGORIES_MANAGE: "categories.manage",
  FLASH_SALES_MANAGE: "flash_sales.manage",
  HOMEPAGE_MANAGE: "homepage.manage",
  ORDERS_READ: "orders.read",
  ORDERS_UPDATE_STATUS: "orders.update_status",
  DELIVERY_MANAGE: "delivery.manage",
  SELLERS_READ: "sellers.read",
  SELLERS_MANAGE: "sellers.manage",
  SELLER_APPLICATIONS_READ: "seller_applications.read",
  SELLER_APPLICATIONS_REVIEW: "seller_applications.review",
  SELLER_TEAM_MANAGE: "seller_team.manage",
  CUSTOMERS_READ_LIMITED: "customers.read_limited",
  SUPPORT_READ: "support.read",
  SUPPORT_MANAGE: "support.manage",
  MESSAGES_MANAGE: "messages.manage",
  COUPONS_MANAGE: "coupons.manage",
  REFERRALS_MANAGE: "referrals.manage",
  NEWSLETTER_MANAGE: "newsletter.manage",
  EMAIL_CAMPAIGNS_MANAGE: "email_campaigns.manage",
  ADMIN_USERS_READ: "admin_users.read",
  ADMIN_USERS_MANAGE: "admin_users.manage",
  ADMIN_ROLES_READ: "admin_roles.read",
  ADMIN_ROLES_MANAGE: "admin_roles.manage",
  AUDIT_LOGS_READ: "audit_logs.read",
  SYSTEM_SETTINGS_MANAGE: "system_settings.manage",
});

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
    this.status = 403;
  }
}

function splitCodes(value) {
  return String(value || "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

export async function getAdminPrincipalByUserId(userId) {
  if (!userId) return null;

  const rows = await query(
    `SELECT
       u.id, u.name, u.email, u.status,
       GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS role_codes,
       GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ',') AS permission_codes
     FROM users u
     JOIN admin_memberships m
       ON m.user_id = u.id AND m.status = 'active'
     JOIN admin_roles r
       ON r.id = m.role_id AND r.is_active = 1
     LEFT JOIN admin_role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE u.id = ?
     GROUP BY u.id, u.name, u.email, u.status
     LIMIT 1`,
    [userId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    roles: splitCodes(row.role_codes),
    permissions: new Set(splitCodes(row.permission_codes)),
  };
}

export function hasPermission(principal, permission) {
  return Boolean(
    principal &&
      permission &&
      (principal.permissions?.has("*") || principal.permissions?.has(permission))
  );
}

export function requirePermission(principal, permission) {
  if (!hasPermission(principal, permission)) {
    throw new AuthorizationError();
  }
  return principal;
}

export function serializePrincipal(principal) {
  if (!principal) return null;
  return {
    id: principal.id,
    name: principal.name,
    email: principal.email,
    status: principal.status,
    roles: principal.roles,
    permissions: [...principal.permissions],
  };
}
