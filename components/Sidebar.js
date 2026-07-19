'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { logout, getSellerName } from '@/lib/auth';
import {
  Home01Icon,
  Package01Icon,
  ShoppingBag01Icon,
  UserGroupIcon,
  ChartBarIncreasingIcon,
  BadgeCheckIcon,
  Menu01Icon,
  Cancel01Icon,
  Logout01Icon,
} from '@hugeicons/core-free-icons';

const nav = [
  { name: 'Overview',      href: '/dashboard',            icon: Home01Icon },
  { name: 'Products',      href: '/dashboard/products',    icon: Package01Icon },
  { name: 'Orders',        href: '/dashboard/orders',      icon: ShoppingBag01Icon },
  { name: 'Analytics',     href: '/dashboard/analytics',   icon: ChartBarIncreasingIcon },
  { name: 'Team',          href: '/dashboard/team',        icon: UserGroupIcon },
  { name: 'Verification',  href: '/dashboard/onboarding',  icon: BadgeCheckIcon },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const sellerName = getSellerName();

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle sidebar"
        className="lg:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white shadow-sm"
      >
        <Icon icon={open ? Cancel01Icon : Menu01Icon} size={18} />
      </button>

      <aside
        className={[
          'fixed top-0 left-0 z-40 flex h-screen w-64 flex-col shrink-0 border-r border-white/10 bg-ink-900 text-ink-300',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <span className="text-lg font-extrabold tracking-tight text-white">
            Trollz<span className="text-brand-500">Seller</span>
          </span>
          <p className="mt-1 truncate text-xs text-ink-500">Seller Dashboard</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active ? 'bg-brand-500 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon icon={item.icon} size={17} strokeWidth={active ? 2 : 1.6} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/10 px-3 py-4">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xs font-black text-white">
              {sellerName ? sellerName[0].toUpperCase() : 'S'}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-semibold text-white">{sellerName || 'Seller'}</p>
              <p className="text-[10px] text-ink-500">Seller account</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-white/5"
          >
            <Icon icon={Logout01Icon} size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm anim-in"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
