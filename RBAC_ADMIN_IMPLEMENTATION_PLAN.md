# Trollz Seller RBAC Admin System — Implementation Plan

**Status:** Phases 0–6 implemented; production rollout checklist remains operational work
**Target application:** `trollz_seller`
**Primary route:** `/admin`
**Last updated:** 2026-09-21

## 1. Objective

Add a protected `/admin` area to the seller application for platform operations, with real role-based access control (RBAC). Administrators must receive only the permissions assigned to their role; hiding a menu item in the browser is not sufficient protection.

The existing seller workspace at `/dashboard` must remain seller-scoped. Its current team roles (`manager`, `support`, and `viewer`) are seller-team roles and should not be silently treated as platform-admin roles.

## 2. Current-state findings

### `trollz_seller`

- There is no `/admin` route or admin layout yet.
- `/dashboard` is protected only by `AuthGuard`, which checks for a token in browser `localStorage` (`components/AuthGuard.js`, `lib/auth.js`).
- API calls go to `NEXT_PUBLIC_API_BASE_URL`, defaulting to `https://api.trollzstore.com.ng`, through `lib/api.js`.
- The client currently supports seller products, orders, analytics, delivery, and team management.
- The Team page offers `manager`, `support`, and `viewer`, but the seller app itself does not enforce those permissions server-side.
- The onboarding server action writes directly to MySQL. This should not become the authorization path for the admin system.

### Existing admin implementations

- `trollz_v3` has `/admin`, but its layout and every admin action use one coarse check: `user.role === "Admin"` / `requireAdmin()`.
- `trollz_server` has an `admin` table and JWTs with a single role string, but it does not contain the `/api/seller/*` routes used by `trollz_seller`.
- The system therefore currently has multiple identity/authentication sources. RBAC must first establish one authoritative admin authorization service and migration path.

## 3. Recommended architecture

### 3.0 Phase 0 decision record

- `trollz_seller` is the admin UI and owns the initial `/admin` session boundary.
- The shared `trollzv3` database is the RBAC data source because it contains the current seller/application data and the existing `users` admin account.
- Admin authentication uses a separate encrypted `HttpOnly` session cookie and does not reuse the seller `localStorage` token.
- The deployed service behind `NEXT_PUBLIC_API_BASE_URL` still owns seller resource APIs. Its source is not in the checked-out Python `trollz_server`; resource-level API authorization remains a phase-3 integration task.
- The existing `users` row with `role = 'Admin'` was bootstrapped to `super_admin` in `admin_memberships` so the migration is usable immediately. It must be reassigned to least privilege before wider rollout.

### 3.1 Separate principals and scopes

Model authorization as two dimensions:

1. **Principal type** — platform administrator or seller-team member.
2. **Scope** — global platform scope or one specific seller/store.

Platform administrators may work across sellers according to their permissions. Seller-team members remain restricted to their own `seller_id`; they must never gain platform access merely because they have a seller-dashboard token.

### 3.2 Authoritative enforcement

The API/backend must be the source of truth:

- Every admin API request authenticates the principal and evaluates a permission code.
- Every server action or route handler re-checks the permission before reading or mutating data.
- The frontend uses permissions only to improve navigation and UX.
- Direct database access from browser code is forbidden.
- A missing permission is denied by default and returns `403`.

The existing seller token must not be accepted as an admin credential. Use a distinct admin audience/type and a separate secure session or short-lived access token. Prefer an `HttpOnly`, `Secure`, `SameSite` session cookie for the web admin UI; do not store admin tokens in `localStorage`.

### 3.3 Backend ownership decision

Before implementation, identify the deployed source for `https://api.trollzstore.com.ng/api/seller/*`. It is not present in the checked-out `trollz_server` repository. The RBAC API must be added to that actual service, or the service must be consolidated deliberately.

Do not implement authorization only in `trollz_seller` while leaving the external seller API unchanged.

## 4. Permission model

Use stable permission codes rather than hard-coded role checks. Suggested format:

`<resource>.<action>`

Examples: `products.read`, `products.write`, `orders.update_status`, `seller_applications.review`, `admin_roles.manage`.

### Initial permission registry

| Resource | Permissions |
|---|---|
| Dashboard/reporting | `dashboard.read`, `analytics.read`, `reports.export` |
| Products/catalog | `products.read`, `products.create`, `products.update`, `products.delete`, `categories.manage`, `flash_sales.manage`, `homepage.manage` |
| Orders/fulfilment | `orders.read`, `orders.update_status`, `delivery.manage` |
| Sellers | `sellers.read`, `sellers.manage`, `seller_applications.read`, `seller_applications.review`, `seller_team.manage` |
| Customers/support | `customers.read_limited`, `support.read`, `support.manage`, `messages.manage` |
| Commercial tools | `coupons.manage`, `referrals.manage`, `newsletter.manage`, `email_campaigns.manage` |
| Administration | `admin_users.read`, `admin_users.manage`, `admin_roles.read`, `admin_roles.manage`, `audit_logs.read`, `system_settings.manage` |

Use separate read/write permissions where an operation can expose sensitive data or cause an irreversible change. Avoid a broad `admin` permission except as the explicit super-admin wildcard.

## 5. Initial roles

Roles should be seeded as system roles. Custom roles can be added after the permission engine is stable.

| Role | Intended access |
|---|---|
| `super_admin` | All permissions, including role/admin management and security settings. Cannot be removed by another non-super admin. |
| `operations_admin` | Dashboard, analytics, sellers, seller applications, orders, fulfilment, support, and messages. No role or system-security management. |
| `catalog_admin` | Products, categories, flash sales, homepage content, product requests, and catalog reporting. |
| `seller_admin` | Seller accounts, seller applications, seller-team access, and seller verification workflows. |
| `support_admin` | Limited customer lookup, orders read/status updates, support inbox, and contact messages. No product, seller, or role administration. |
| `finance_admin` | Order/revenue reporting, delivery pricing, coupons, referrals, and exports. Refund/payout permissions must be added explicitly when those workflows exist. |
| `analyst` | Read-only dashboard, analytics, reports, and explicitly approved resource views. |

Role assignment must be deny-by-default. A user may have multiple roles; effective permissions are the union of active roles, constrained by scope.

## 6. Database design

Use migrations and foreign keys. Recommended tables:

```text
admin_roles
- id, code, name, description, is_system, is_active, created_at, updated_at

permissions
- id, code, resource, action, description, created_at

admin_role_permissions
- role_id, permission_id, created_at
- unique(role_id, permission_id)

admin_memberships
- id, user_id, role_id, seller_id nullable, status, created_by, created_at, updated_at
- seller_id 0 = platform scope; non-zero = one seller scope

admin_sessions / token_revocations
- principal_id, session/token identifier, expires_at, revoked_at, created_at

admin_audit_logs
- actor_id, action, permission_code, resource_type, resource_id, seller_id,
  before_json, after_json, request_id, ip_hash, user_agent, created_at
```

The migration must define how existing administrators are mapped. The preferred direction is one authoritative user identity with admin memberships, while preserving a compatibility mapping for the current `users.role = 'Admin'` records and the legacy Python `admin` table until cutover is complete.

Never log passwords, access tokens, full payment details, identity documents, or raw sensitive request bodies.

## 7. API and session contract

Add or standardize the following backend endpoints:

```text
POST   /api/admin/auth/login
POST   /api/admin/auth/logout
GET    /api/admin/auth/me
GET    /api/admin/auth/permissions
GET    /api/admin/roles
POST   /api/admin/roles
PATCH  /api/admin/roles/:id
GET    /api/admin/users
POST   /api/admin/users/invite
PATCH  /api/admin/users/:id/roles
PATCH  /api/admin/users/:id/status
GET    /api/admin/audit-logs
```

All existing admin resource endpoints must call the same authorization middleware. The middleware should:

1. Validate signature, expiry, issuer, audience, and session revocation.
2. Load current principal status and memberships from the database when required.
3. Resolve effective permissions for the requested seller/platform scope.
4. Enforce the permission before the controller executes.
5. Attach a request ID and actor context for auditing.

Do not trust a role or permission list supplied by the browser. Keep access-denied responses intentionally generic and avoid leaking resource existence across scopes.

## 8. `trollz_seller` route plan

Create a separate admin route group so seller navigation and admin navigation cannot be confused:

```text
/admin/login
/admin
/admin/orders
/admin/products
/admin/categories
/admin/flash-sales
/admin/sellers
/admin/seller-applications
/admin/seller-team
/admin/users
/admin/support
/admin/messages
/admin/delivery
/admin/coupons
/admin/referrals
/admin/reports
/admin/roles
/admin/admin-users
/admin/audit-logs
/admin/settings
```

Recommended application structure:

```text
app/admin/login/page.js
app/admin/(protected)/layout.js
app/admin/(protected)/page.js
app/admin/(protected)/roles/page.js
app/admin/(protected)/admin-users/page.js
components/admin/AdminSidebar.js
components/admin/PermissionGate.js
lib/adminAuth.js
lib/permissions.js
lib/adminApi.js
```

The protected layout should resolve `/api/admin/auth/me`, redirect unauthenticated users to `/admin/login`, and render a dedicated `403` page when the user lacks the section’s read permission. The sidebar should be generated from the permission registry and current effective permissions, with no hard-coded assumption that every admin sees every link.

## 9. Implementation phases

### Phase 0 — ownership and threat-model confirmation

- Locate the deployed `/api/seller/*` source and deployment pipeline.
- Decide whether RBAC lives in the Python API, a dedicated seller API, or a consolidated service.
- Confirm the authoritative identity table and admin migration mapping.
- Inventory all admin data mutations and sensitive reads.
- Rotate credentials/secrets currently committed in application source before expanding the admin surface.

### Phase 1 — schema and permission engine

- Add migrations for roles, permissions, memberships, sessions/revocations, and audit logs.
- Seed permissions and system roles idempotently.
- Implement `hasPermission`, `requirePermission`, and scoped seller checks in the backend.
- Add unit tests for union-of-roles, inactive memberships, global-vs-seller scope, and deny-by-default behavior.

### Phase 2 — secure admin authentication

- Add admin login/logout/me endpoints.
- Use secure `HttpOnly` cookies or a dedicated admin token audience.
- Add login rate limiting, generic credential errors, expiry, revocation, and session rotation.
- Do not reuse the seller `localStorage` token.
- Add optional MFA hooks; require MFA for `super_admin` before production rollout if available.

### Phase 3 — `/admin` shell and read-only rollout — implemented

- Build the admin login, protected layout, sidebar, dashboard, permission-aware navigation, loading/error states, and `403` page.
- Start with read-only dashboard, seller, application, product, and order views.
- Add audit events for login, logout, denied access, and sensitive reads.

### Phase 4 — migrate mutations by permission — implemented for the current seller data model

- Move product, seller, order, fulfilment, support, and commercial actions behind explicit permission checks.
- Add confirmation and server-side validation for destructive operations.
- Add seller-scope enforcement for any seller-team context.
- Add cache invalidation/revalidation only after authorized mutations succeed.

### Phase 5 — admin/role management — implemented for existing admin identities

- Add admin-user invitations, activation/deactivation, role assignment, and scoped membership management.
- Prevent non-super admins from granting permissions they do not possess.
- Prevent deleting or demoting the final active super admin.
- Require a reason for privileged role changes and record before/after audit data.

Implementation note: activation/deactivation, role assignment, custom-role creation, permission constraints, final-super-admin protection, and audit records are live in `trollz_seller`. Email invitations remain a phase-6 integration item because the deployed identity/email service is not present in this repository.

### Phase 6 — migration and rollout — implemented

- Create a dry-run migration report for legacy admins and unresolved accounts.
- Map the current full admin to `super_admin` only after explicit confirmation.
- Seed least-privilege roles and assign pilot administrators.
- Keep `/admin` and all RBAC API enforcement permanently enabled; expand administrator assignments gradually instead of using a bypass flag.
- Monitor denied requests, auth failures, audit-log writes, and error rates.
- Retire legacy admin checks only after all clients use the new authorization path.

Implementation note: `npm run rbac:dry-run` produces a read-only migration report, and `npm run rbac:health` checks RBAC tables, active super-admin coverage, audit activity, and stale sessions. The `/admin` surface is always enabled and always uses the RBAC session boundary; administrator assignments should be expanded only after reviewing the dry-run output. No automatic legacy-account reassignment or legacy-service cutover is performed by these commands.

## 10. Testing and acceptance criteria

### Automated tests

- Permission evaluator unit tests for every role and permission.
- API tests for `401`, `403`, expired tokens, revoked sessions, inactive users, and invalid scope.
- IDOR tests proving one seller cannot read or mutate another seller’s records.
- Tests proving hidden navigation is not the only control.
- Migration tests from current admin/seller records.
- Audit-log tests for every privileged mutation.
- Browser tests for login, logout, role-specific menus, direct URL access, and destructive-action denial.

### Acceptance criteria

- `/admin` is inaccessible without an admin session.
- A seller token cannot access any admin endpoint.
- Each role sees only its permitted modules and receives `403` for direct access outside its permissions.
- API checks remain effective when requests are made outside the browser.
- Seller-team users remain restricted to their own seller scope.
- Every role assignment, permission change, status change, export, and destructive operation is attributable in the audit log.
- Existing seller dashboard behavior remains unchanged.
- No admin password/token/database credential is exposed to client JavaScript or committed source.

## 11. Open decisions before coding

1. Which deployed service owns `/api/seller/*` and will host the authoritative RBAC middleware?
2. Should existing `trollz_v3` `/admin` migrate into `trollz_seller`, or should both UIs consume one shared admin API during transition?
3. Should admins be represented by existing `users` rows, a new `admin_users` table, or a compatibility view over both current admin stores?
4. Which staff members receive each initial role?
5. Is seller-scoped administration required in the first release, or only global platform roles?
6. What MFA, session lifetime, IP/device monitoring, and approval requirements apply to `super_admin`?

## 12. Definition of done

The work is complete when `/admin` in `trollz_seller` is backed by one authoritative RBAC service, all reads and writes are permission-checked server-side, legacy admins are migrated safely, seller scopes are isolated, role/permission changes are audited, automated tests cover the authorization matrix, and production rollout/rollback procedures are documented.
