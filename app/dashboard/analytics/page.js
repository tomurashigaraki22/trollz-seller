'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Icon from '@/components/Icon';
import { Location01Icon, TrendingUpDownIcon } from '@hugeicons/core-free-icons';

const RANGES = ['7d', '30d', '90d'];

function dayLabel(dayStr) {
  if (!dayStr) return '';
  try {
    return new Date(dayStr).toLocaleDateString('en', { weekday: 'short' });
  } catch {
    return dayStr;
  }
}

function BarChart({ items = [], valueKey, title, subtitle, color }) {
  const values = items.map((d) => Number(d[valueKey] ?? 0));
  const max = Math.max(...values, 1);
  const grad = color || 'var(--grad-primary)';

  return (
    <div className="ts-card p-6 h-full">
      <div className="mb-5">
        <h3 className="font-bold text-sm" style={{ color: 'var(--text-base)' }}>{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-32" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">No data available</p>
        </div>
      ) : (
        <div className="flex items-end gap-1.5 h-40">
          {items.map((d, i) => {
            const v = Number(d[valueKey] ?? 0);
            const label = d.label || dayLabel(d.day) || String(i + 1);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                <div
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                  style={{ background: 'var(--bg-overlay)', boxShadow: 'var(--shadow-sm)', color: 'var(--text-base)' }}
                >
                  {v.toLocaleString()}
                </div>
                <div
                  className="w-full rounded-t-[4px]"
                  style={{
                    height: `${(v / max) * 100}%`,
                    background: grad,
                    opacity: 0.82,
                    minHeight: v > 0 ? '4px' : '2px',
                  }}
                />
                <span className="text-[10px] shrink-0 leading-none" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, loading }) {
  return (
    <div
      className="p-5 rounded-2xl"
      style={{ background: 'var(--bg-overlay)', boxShadow: '0 0 0 1px var(--border-muted)' }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {loading ? (
        <div className="ts-skeleton h-8 w-24" />
      ) : (
        <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-base)' }}>{value}</p>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');

  const load = (r) => {
    setLoading(true);
    apiClient.getAnalytics({ range: r })
      .then((res) => setData(res.data ?? res))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(range); }, [range]);

  // backend returns:
  //   summary: { total_orders, total_revenue }
  //   orders_chart: [{ day, count, revenue }]
  //   revenue_chart: [{ day, revenue }]
  //   top_locations: [{ label, value }]
  //   top_products: [{ label, value }]
  const summary = data?.summary ?? {};
  const ordersChart = data?.orders_chart ?? [];
  const revenueChart = data?.revenue_chart ?? [];
  const topLocations = data?.top_locations ?? [];
  const topProducts = data?.top_products ?? [];

  const maxLoc = Math.max(...topLocations.map((l) => Number(l.value ?? 0)), 1);
  const maxProd = Math.max(...topProducts.map((p) => Number(p.value ?? 0)), 1);

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-base)' }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Insights into your store performance.
          </p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`ts-btn-sm uppercase ${range === r ? 'ts-btn-primary' : 'ts-btn-secondary'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Total Orders"
          value={loading ? '-' : (summary.total_orders ?? 0).toLocaleString()}
          loading={loading}
        />
        <StatTile
          label="Total Revenue"
          value={loading ? '-' : `N${Number(summary.total_revenue ?? 0).toLocaleString()}`}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <BarChart
          items={ordersChart}
          valueKey="count"
          title="Orders"
          subtitle={`Orders placed — last ${range}`}
        />
        <BarChart
          items={revenueChart}
          valueKey="revenue"
          title="Revenue (N)"
          subtitle={`Revenue earned — last ${range}`}
          color="linear-gradient(135deg, #6366f1, #3b82f6)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top locations */}
        <div className="ts-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Icon icon={Location01Icon} size={16} style={{ color: 'var(--primary)' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-base)' }}>Top Delivery Locations</h3>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="ts-skeleton h-10 rounded-xl" />)}
            </div>
          ) : topLocations.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No location data yet</p>
          ) : (
            <div className="space-y-3">
              {topLocations.map((loc, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon icon={Location01Icon} size={12} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-base)' }} className="font-medium">{loc.label}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }} className="tabular-nums">
                      {Number(loc.value ?? 0).toLocaleString()} orders
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(Number(loc.value ?? 0) / maxLoc) * 100}%`, background: 'var(--grad-primary)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="ts-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Icon icon={TrendingUpDownIcon} size={16} style={{ color: 'var(--primary)' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-base)' }}>Top Products</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="ts-skeleton h-12 rounded-xl" />)}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No product data yet</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg-overlay)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-black"
                      style={{ background: 'var(--grad-primary)', color: '#fff' }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>{p.label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
                      {Number(p.value ?? 0).toLocaleString()} sold
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
