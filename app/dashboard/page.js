'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { getSellerStore } from '@/lib/auth';
import Badge from '@/components/Badge';
import Icon from '@/components/Icon';
import {
  Package01Icon,
  ShoppingBag01Icon,
  DollarCircleIcon,
  TrendingUpDownIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import Link from 'next/link';

function MetricCard({ label, value, sub, icon, gradient, loading }) {
  return (
    <div
      className="ts-card metric-accent-bar relative p-6"
      style={{ '--_grad': gradient }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
          {loading ? (
            <div className="ts-skeleton h-9 w-28" />
          ) : (
            <p className="text-3xl font-black tabular-nums leading-none" style={{ color: 'var(--text-base)' }}>
              {value}
            </p>
          )}
          {!loading && sub && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{sub}</p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: gradient, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
        >
          <Icon icon={icon} size={21} className="text-white" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function SparkChart({ data = [], label }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="ts-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-base)' }}>{label}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Last 7 days</p>
        </div>
        <Link href="/dashboard/analytics" className="ts-btn-ghost ts-btn-sm flex items-center gap-1.5">
          Full analytics
          <Icon icon={ArrowRight01Icon} size={13} />
        </Link>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
            <div
              className="chart-bar w-full"
              style={{ height: `${(d.value / max) * 100}%` }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderRow({ order }) {
  const statusVariant =
    order.status === 'delivered' ? 'success'
    : order.status === 'shipped' ? 'info'
    : order.status === 'processing' ? 'warning'
    : order.status === 'cancelled' ? 'error'
    : 'default';

  return (
    <div
      className="flex items-center justify-between py-3.5 gap-4"
      style={{ borderBottom: '1px solid var(--border-muted)' }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-base)' }}>
          #{order.id || order.order_number}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
          {order.city || order.delivery_city || 'Unknown location'} &middot; {order.items_count ?? order.items?.length ?? '-'} item(s)
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
          N{Number(order.total || 0).toLocaleString()}
        </p>
        <Badge variant={statusVariant} dot>{order.status}</Badge>
      </div>
    </div>
  );
}

const PLACEHOLDER_CHART = [
  { label: 'Mon', value: 12 },
  { label: 'Tue', value: 19 },
  { label: 'Wed', value: 7 },
  { label: 'Thu', value: 25 },
  { label: 'Fri', value: 31 },
  { label: 'Sat', value: 22 },
  { label: 'Sun', value: 16 },
];

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const storeName = getSellerStore();

  useEffect(() => {
    apiClient.getDashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const s = data?.summary ?? {};
  const recentOrders = data?.recent_orders ?? [];
  const chartData = data?.orders_chart ?? PLACEHOLDER_CHART;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-base)' }}>
          {storeName || 'Overview'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Here's what's happening with your store today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Products Listed"
          value={loading ? '-' : (s.total_products ?? 0).toLocaleString()}
          icon={Package01Icon}
          gradient="linear-gradient(135deg, #22c55e, #10b981)"
          loading={loading}
        />
        <MetricCard
          label="Total Orders"
          value={loading ? '-' : (s.total_orders ?? 0).toLocaleString()}
          sub={`${s.pending_orders ?? 0} pending`}
          icon={ShoppingBag01Icon}
          gradient="linear-gradient(135deg, #6366f1, #3b82f6)"
          loading={loading}
        />
        <MetricCard
          label="Total Revenue"
          value={loading ? '-' : `N${(s.total_revenue ?? 0).toLocaleString()}`}
          sub="All time"
          icon={DollarCircleIcon}
          gradient="linear-gradient(135deg, #f59e0b, #ef4444)"
          loading={loading}
        />
        <MetricCard
          label="This Month"
          value={loading ? '-' : `N${(s.monthly_revenue ?? 0).toLocaleString()}`}
          sub={`${s.monthly_orders ?? 0} orders`}
          icon={TrendingUpDownIcon}
          gradient="linear-gradient(135deg, #ec4899, #a855f7)"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <SparkChart data={chartData} label="Orders This Week" />

        <div className="ts-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-base)' }}>Recent Orders</h2>
            <Link href="/dashboard/orders" className="ts-btn-ghost ts-btn-sm flex items-center gap-1.5">
              View all
              <Icon icon={ArrowRight01Icon} size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="ts-skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-overlay)' }}
              >
                <Icon icon={ShoppingBag01Icon} size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No orders yet</p>
            </div>
          ) : (
            <div>
              {recentOrders.slice(0, 5).map((o, i) => (
                <OrderRow key={o.id ?? i} order={o} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
