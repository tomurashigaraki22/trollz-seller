import { requireAdminContext } from '@/lib/admin-session';
import { getAdminPlatformUsers } from '@/lib/admin-data';
import { PERMISSIONS } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function AdminPlatformUsersPage() {
  await requireAdminContext(PERMISSIONS.CUSTOMERS_READ_LIMITED);
  const users = await getAdminPlatformUsers();
  return <section><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Platform accounts</p><h1 className="mt-2 text-2xl font-black text-ink-900">Users</h1><p className="mt-1 text-sm text-ink-600">Platform users visible to your assigned customer-read permission. Administrator accounts are listed here too, while access management remains under Admin users.</p><div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-3 py-3">User</th><th className="px-3 py-3">Phone</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">ID</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-ink-100"><td className="px-3 py-3"><p className="font-semibold text-ink-900">{user.name}</p><p className="text-xs text-ink-500">{user.email}</p></td><td className="px-3 py-3">{user.phone || '—'}</td><td className="px-3 py-3">{user.role}</td><td className="px-3 py-3">{user.status}</td><td className="px-3 py-3 text-xs text-ink-500">{user.id}</td></tr>)}</tbody></table></div></section>;
}
