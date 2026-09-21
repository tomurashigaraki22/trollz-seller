'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/admin', label: 'Overview', permission: 'dashboard.read' },
  { href: '/admin/products', label: 'Products', permission: 'products.read' },
  { href: '/admin/orders', label: 'Orders', permission: 'orders.read' },
  { href: '/admin/sellers', label: 'Sellers', permission: 'sellers.read' },
  { href: '/admin/seller-applications', label: 'Seller applications', permission: 'seller_applications.read' },
  { href: '/admin/users', label: 'Users', permission: 'customers.read_limited' },
  { href: '/admin/roles', label: 'Roles', permission: 'admin_roles.read' },
  { href: '/admin/admin-users', label: 'Admin users', permission: 'admin_users.read' },
  { href: '/admin/audit-logs', label: 'Audit log', permission: 'audit_logs.read' },
];

export default function AdminShell({ admin, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const permissions = new Set(admin?.permissions || []);
  const can = (permission) => permissions.has('*') || permissions.has(permission);

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ink-50 lg:flex">
      <aside className="flex w-full shrink-0 flex-col bg-ink-900 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-lg font-black">Trollz<span className="text-brand-500">Admin</span></p>
          <p className="mt-1 truncate text-xs text-ink-400">{admin.email}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:block lg:flex-1 lg:space-y-1 lg:overflow-y-auto lg:overflow-x-hidden">
          {links.filter((link) => can(link.permission)).map((link) => {
            const active = link.href === '/admin' ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'bg-brand-500 text-white' : 'text-ink-300 hover:bg-white/10 hover:text-white'}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center justify-between border-t border-white/10 px-5 py-4 lg:w-full">
          <span className="truncate text-xs text-ink-400">{admin.roles.join(', ')}</span>
          <button type="button" onClick={logout} className="text-xs font-semibold text-danger">Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 lg:p-8">{children}</main>
    </div>
  );
}
