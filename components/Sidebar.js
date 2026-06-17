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
  Menu01Icon,
  Cancel01Icon,
  Logout01Icon,
} from '@hugeicons/core-free-icons';

const nav = [
  { name: 'Overview',  href: '/dashboard',          icon: Home01Icon },
  { name: 'Products',  href: '/dashboard/products',  icon: Package01Icon },
  { name: 'Orders',    href: '/dashboard/orders',    icon: ShoppingBag01Icon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIncreasingIcon },
  { name: 'Team',      href: '/dashboard/team',      icon: UserGroupIcon },
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
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] transition-all"
        style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)' }}
      >
        <Icon icon={open ? Cancel01Icon : Menu01Icon} size={18} />
      </button>

      <aside
        className={[
          'fixed top-0 left-0 z-40 h-screen w-[220px] flex flex-col',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center gap-3 px-5 h-[60px] shrink-0"
          style={{ borderBottom: '1px solid var(--border-muted)' }}
        >
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--grad-primary)', boxShadow: 'var(--shadow-glow)' }}
          >
            <span className="text-sm font-black text-white tracking-tight">T</span>
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-bold text-[var(--text-base)] tracking-tight">
              Trollz<span style={{ color: 'var(--primary)' }}>Store</span>
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Seller Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p
            className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Navigation
          </p>
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`nav-link${active ? ' active' : ''}`}
              >
                <Icon icon={item.icon} size={17} strokeWidth={active ? 2 : 1.6} className="nav-icon" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 shrink-0 space-y-2" style={{ borderTop: '1px solid var(--border-muted)' }}>
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]"
            style={{ background: 'var(--bg-hover)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black text-white"
              style={{ background: 'var(--grad-primary)' }}
            >
              {sellerName ? sellerName[0].toUpperCase() : 'S'}
            </div>
            <div className="leading-tight min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text-base)] truncate">
                {sellerName || 'Seller'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Seller account</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0 animate-pulse" />
          </div>
          <button onClick={handleLogout} className="ts-btn-ghost ts-btn-sm w-full justify-start">
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
