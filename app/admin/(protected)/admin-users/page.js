import { requireAdminContext } from '@/lib/admin-session';
import { getAdminUsers, getAdminRoles } from '@/lib/admin-data';
import { PERMISSIONS } from '@/lib/rbac';
import AdminUserManager from '@/components/admin/AdminUserManager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const { admin } = await requireAdminContext(PERMISSIONS.ADMIN_USERS_READ);
  const [users, allRoles] = await Promise.all([getAdminUsers(), getAdminRoles()]);
  const roles = allRoles.filter((role) => Number(role.is_active) === 1);
  const canManage = admin.permissions.includes('*') || admin.permissions.includes(PERMISSIONS.ADMIN_USERS_MANAGE);
  return <section><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Access control</p><h1 className="mt-2 text-2xl font-black text-ink-900">Admin users</h1><p className="mt-1 text-sm text-ink-600">Assign existing roles or deactivate access. Invitations can be added once the identity provider is connected.</p><div className="mt-6"><AdminUserManager users={users} roles={roles} canManage={canManage} /></div></section>;
}
