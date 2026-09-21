import { redirect } from 'next/navigation';
import { getAdminDashboardStats } from '@/lib/admin-data';
import { PERMISSIONS } from '@/lib/rbac';
import { requireAdminContext } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminCheckpointPage() {
  const context = await requireAdminContext(PERMISSIONS.DASHBOARD_READ);
  if (!context) redirect('/admin/login');
  const { admin } = context;
  const stats = await getAdminDashboardStats();

  const cards = [
    ['Products', stats.products],
    ['Sellers', stats.sellers],
    ['Pending applications', stats.pendingApplications],
    ['Seller orders', stats.orders],
    ['Active admins', stats.admins],
  ];

  return (
    <main className="min-h-screen bg-ink-50 p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Platform administration</p>
        <h1 className="mt-2 text-2xl font-black text-ink-900">Welcome, {admin.name || admin.email}</h1>
        <p className="mt-2 text-sm text-ink-600">Your dashboard is permission-scoped by RBAC.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-ink-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-ink-900">{value.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink-800">Active roles</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {admin.roles.map((role) => <span key={role} className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700">{role}</span>)}
          </div>
        </div>
      </div>
    </main>
  );
}
