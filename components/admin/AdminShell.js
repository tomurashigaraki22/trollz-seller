'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { Menu01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

const links = [
  { href: '/admin', label: 'Overview', permission: 'dashboard.read' },
  { href: '/admin/products', label: 'Products', permission: 'products.read' },
  { href: '/admin/orders', label: 'Orders', permission: 'orders.read' },
  { href: '/admin/sellers', label: 'Sellers', permission: 'sellers.read' },
  { href: '/admin/seller-applications', label: 'Seller applications', permission: 'seller_applications.read' },
  { href: '/admin/banner-ads', label: 'Banner ads', permission: 'homepage.manage' },
  { href: '/admin/users', label: 'Users', permission: 'customers.read_limited' },
  { href: '/admin/roles', label: 'Roles', permission: 'admin_roles.read' },
  { href: '/admin/admin-users', label: 'Admin users', permission: 'admin_users.read' },
  { href: '/admin/audit-logs', label: 'Audit log', permission: 'audit_logs.read' },
];

export default function AdminShell({ admin, children }) {
  const [open, setOpen] = useState(false);
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
    <div className="min-h-screen bg-ink-50">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle sidebar"
        aria-expanded={open}
        className="lg:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white shadow-sm"
      >
        <Icon icon={open ? Cancel01Icon : Menu01Icon} size={18} />
      </button>

      <aside
        className={[
          'fixed top-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-ink-900 text-white',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-lg font-black">Trollz<span className="text-brand-500">Admin</span></p>
          <p className="mt-1 truncate text-xs text-ink-400">{admin.email}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {links.filter((link) => can(link.permission)).map((link) => {
            const active = link.href === '/admin' ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-brand-500 text-white' : 'text-ink-300 hover:bg-white/10 hover:text-white'}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <span className="truncate text-xs text-ink-400">{admin.roles.join(', ')}</span>
          <button type="button" onClick={logout} className="text-xs font-semibold text-danger">Sign out</button>
        </div>
      </aside>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="min-w-0 lg:pl-72">
        <div className="px-5 py-5 pt-16 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
