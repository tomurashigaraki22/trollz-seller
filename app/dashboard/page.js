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
  AlertDiamondIcon,
  ArrowRight01Icon,
  StarIcon,
  Cancel01Icon,
  ChartIncreaseIcon,
  BadgeCheckIcon,
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

function SparkChart({ data = [] }) {
  // backend returns { day, total } per item
  const values = data.map((d) => Number(d.total ?? d.value ?? 0));
  const max = Math.max(...values, 1);
  const labels = data.map((d) => {
    if (d.label) return d.label;
    if (d.day) return new Date(d.day).toLocaleDateString('en', { weekday: 'short' });
    return '';
  });

  return (
    <div className="ts-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-base)' }}>Revenue — Last 7 Days</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Daily sales total</p>
        </div>
        <Link href="/dashboard/analytics" className="ts-btn-ghost ts-btn-sm flex items-center gap-1.5">
          Full analytics
          <Icon icon={ArrowRight01Icon} size={13} />
        </Link>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-32" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">No data yet</p>
        </div>
      ) : (
        <div className="flex items-end gap-1.5 h-32">
          {values.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
              <div
                className="chart-bar w-full"
                style={{ height: `${(v / max) * 100}%` }}
                title={`${labels[i]}: N${v.toLocaleString()}`}
              />
              <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{labels[i]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function statusVariant(s) {
  return s === 'delivered' ? 'success'
    : s === 'shipped'    ? 'info'
    : s === 'processing' ? 'warning'
    : s === 'cancelled'  ? 'error'
    : 'default';
}

function OrderRow({ order }) {
  // backend fields: id, order_number, buyer_name, total_amount, order_status, payment_status, created_at
  const status = order.order_status || order.status || 'pending';
  const location = order.delivery_city || order.city || '';

  return (
    <div
      className="flex items-center justify-between py-3.5 gap-4"
      style={{ borderBottom: '1px solid var(--border-muted)' }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-base)' }}>
          #{order.order_number || order.id}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
          {location ? `${location} · ` : ''}{order.buyer_name || 'Customer'}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
          N{Number(order.total_amount || 0).toLocaleString()}
        </p>
        <Badge variant={statusVariant(status)} dot>{status}</Badge>
      </div>
    </div>
  );
}

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

  // backend summary fields: total_products, low_stock_products, total_orders, total_sales
  const s = data?.summary ?? {};
  const recentOrders = data?.recent_orders ?? [];
  const chartData = data?.orders_chart ?? [];

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
          gradient="linear-gradient(135deg, #fe4c1c, #e83f10)"
          loading={loading}
        />
        <MetricCard
          label="Total Orders"
          value={loading ? '-' : (s.total_orders ?? 0).toLocaleString()}
          icon={ShoppingBag01Icon}
          gradient="linear-gradient(135deg, #6366f1, #3b82f6)"
          loading={loading}
        />
        <MetricCard
          label="Total Sales"
          value={loading ? '-' : `N${Number(s.total_sales ?? 0).toLocaleString()}`}
          sub="Paid orders"
          icon={DollarCircleIcon}
          gradient="linear-gradient(135deg, #f59e0b, #ef4444)"
          loading={loading}
        />
        <MetricCard
          label="Low Stock"
          value={loading ? '-' : (s.low_stock_products ?? 0).toLocaleString()}
          sub="5 or fewer units"
          icon={AlertDiamondIcon}
          gradient="linear-gradient(135deg, #ec4899, #a855f7)"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Conversion Rate"
          value={loading ? '-' : `${Number(s.conversion_rate ?? 0).toFixed(1)}%`}
          sub="Paid orders vs views/orders"
          icon={ChartIncreaseIcon}
          gradient="linear-gradient(135deg, #14b8a6, #22c55e)"
          loading={loading}
        />
        <MetricCard
          label="Cancellation Rate"
          value={loading ? '-' : `${Number(s.cancellation_rate ?? 0).toFixed(1)}%`}
          sub="Lower is better"
          icon={Cancel01Icon}
          gradient="linear-gradient(135deg, #ef4444, #f97316)"
          loading={loading}
        />
        <MetricCard
          label="Customer Rating"
          value={loading ? '-' : `${Number(s.average_rating ?? 0).toFixed(1)}/5`}
          sub={`${Number(s.rating_count ?? 0).toLocaleString()} rating${Number(s.rating_count ?? 0) === 1 ? '' : 's'}`}
          icon={StarIcon}
          gradient="linear-gradient(135deg, #eab308, #f59e0b)"
          loading={loading}
        />
        <MetricCard
          label="Seller Badge"
          value={loading ? '-' : (s.badge_label ?? 'Growing Seller')}
          sub={s.top_seller_badge ? 'High-performing store' : 'Keep building momentum'}
          icon={BadgeCheckIcon}
          gradient={s.top_seller_badge ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #64748b, #475569)'}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <SparkChart data={chartData} />

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
              {[...Array(4)].map((_, i) => <div key={i} className="ts-skeleton h-14 rounded-xl" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-overlay)' }}>
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
