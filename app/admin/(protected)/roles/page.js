import { requireAdminContext } from '@/lib/admin-session';
import { getAdminRoles } from '@/lib/admin-data';
import { getPermissionRegistry } from '@/lib/admin-management';
import { PERMISSIONS } from '@/lib/rbac';
import RoleManager from '@/components/admin/RoleManager';

export const dynamic = 'force-dynamic';

export default async function AdminRolesPage() {
  const { admin } = await requireAdminContext(PERMISSIONS.ADMIN_ROLES_READ);
  const [roles, permissions] = await Promise.all([getAdminRoles(), getPermissionRegistry()]);
  const canManage = admin.permissions.includes('*') || admin.permissions.includes(PERMISSIONS.ADMIN_ROLES_MANAGE);
  return <section><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Access control</p><h1 className="mt-2 text-2xl font-black text-ink-900">Roles and permissions</h1><p className="mt-1 text-sm text-ink-600">System roles are protected. Custom roles can only contain permissions the acting administrator already has.</p><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{roles.map((role) => <article key={role.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-ink-900">{role.name}</h2><span className="rounded-full bg-ink-100 px-2 py-1 text-[10px] font-semibold uppercase text-ink-600">{Number(role.is_system) ? 'System' : 'Custom'}</span></div><p className="mt-1 text-xs text-ink-500">{role.code}</p><p className="mt-3 text-sm text-ink-600">{role.description || 'No description.'}</p><div className="mt-4 flex gap-4 text-xs font-semibold text-ink-500"><span>{role.permission_count} permissions</span><span>{role.member_count} members</span></div></article>)}</div>{canManage && <RoleManager permissions={permissions} />}</section>;
}
