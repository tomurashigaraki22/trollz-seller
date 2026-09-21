# RBAC rollout and rollback runbook

RBAC is always enabled. There is no environment variable or browser switch that bypasses the admin authorization checks.

## Preflight

Configure these server-only variables in the deployment environment:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME=trollzv3
ADMIN_SESSION_PASSWORD=<at least 32 random characters>
```

Run the read-only checks from `trollz_seller`:

```text
npm run rbac:dry-run
npm run rbac:health
```

The dry run must show zero unresolved admin memberships. The health check must show at least one active `super_admin`.

## Pilot rollout

1. Sign in at `/admin/login` with the existing assigned admin account.
2. Review `/admin/roles` and `/admin/audit-logs`.
3. Assign least-privilege roles from `/admin/admin-users` as pilot staff are approved.
4. Keep the original active `super_admin` until another administrator has been verified.
5. Re-run both health commands after each privileged assignment change.

Role changes require a reason and are written to `admin_audit_logs`.

## Rollback

Rollback means removing access, not disabling RBAC. Use `/admin/admin-users` to deactivate a pilot account or remove its role assignment. The final active `super_admin` cannot be demoted or deactivated by the application.

If the admin UI is unavailable, suspend only the affected membership rows in a reviewed database transaction, then run `npm run rbac:health`:

```sql
START TRANSACTION;
UPDATE admin_memberships
SET status = 'suspended'
WHERE user_id = <reviewed_user_id> AND status = 'active';
COMMIT;
```

Do not delete roles, permissions, audit records, or the final super-admin membership during incident response.

## Monitoring

Monitor `/admin/audit-logs`, failed login responses, denied-access events, audit-write failures, and expired sessions. The current admin UI is backed by the shared `trollzv3` database; the external seller API still requires a separate service cutover before its legacy authorization checks can be retired.
