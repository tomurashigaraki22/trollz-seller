'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Badge from '@/components/Badge';
import Icon from '@/components/Icon';
import {
  ShoppingBag01Icon,
  Search01Icon,
  Location01Icon,
  Cancel01Icon,
  Package01Icon,
} from '@hugeicons/core-free-icons';

const STATUS_FILTERS = ['all', 'processing', 'shipped', 'delivered', 'cancelled'];

function statusVariant(s) {
  return s === 'delivered' ? 'success'
    : s === 'shipped'    ? 'info'
    : s === 'processing' ? 'warning'
    : s === 'cancelled'  ? 'error'
    : 'default';
}

function OrderDrawer({ order, onClose }) {
  if (!order) return null;
  const items = order.items ?? order.order_items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end anim-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-[420px] h-full overflow-y-auto anim-scale"
        style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-muted)' }}
        >
          <div>
            <h2 className="font-bold" style={{ color: 'var(--text-base)' }}>
              Order #{order.id || order.order_number}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {order.created_at ? new Date(order.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' }) : '-'}
            </p>
          </div>
          <button onClick={onClose} className="ts-btn-ghost ts-btn-sm p-2">
            <Icon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center justify-between">
            <Badge variant={statusVariant(order.status)} dot>
              {order.status?.replace('_', ' ')}
            </Badge>
            <p className="text-lg font-black tabular-nums" style={{ color: 'var(--primary)' }}>
              N{Number(order.total || 0).toLocaleString()}
            </p>
          </div>

          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'var(--bg-overlay)', boxShadow: '0 0 0 1px var(--border-muted)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'var(--info-bg)' }}
            >
              <Icon icon={Location01Icon} size={15} style={{ color: 'var(--info-text)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Delivery address</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>
                {order.delivery_address || order.shipping_address || 'Address not available'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {[order.city || order.delivery_city, order.state || order.delivery_state].filter(Boolean).join(', ') || '-'}
              </p>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-overlay)', boxShadow: '0 0 0 1px var(--border-muted)' }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Buyer info</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Name</span>
                <span className="font-medium" style={{ color: 'var(--text-base)' }}>
                  {order.buyer_name || order.customer_name || 'Hidden'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>City</span>
                <span className="font-medium" style={{ color: 'var(--text-base)' }}>
                  {order.city || order.delivery_city || '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>State</span>
                <span className="font-medium" style={{ color: 'var(--text-base)' }}>
                  {order.state || order.delivery_state || '-'}
                </span>
              </div>
            </div>
            <p
              className="text-[11px] mt-3 pt-3"
              style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-muted)' }}
            >
              Contact details are not shown to protect buyer privacy.
            </p>
          </div>

          {items.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                Items ({items.length})
              </p>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-overlay)' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'var(--bg-card)' }}
                      >
                        <Icon icon={Package01Icon} size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>
                          {item.name || item.product_name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Qty: {item.quantity ?? 1}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums shrink-0" style={{ color: 'var(--text-base)' }}>
                      N{Number((item.price || item.unit_price || 0) * (item.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-overlay)', boxShadow: '0 0 0 1px var(--border-muted)' }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Payment</p>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>Status</span>
              <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'} dot>
                {order.payment_status || 'pending'}
              </Badge>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span style={{ color: 'var(--text-muted)' }}>Method</span>
              <span className="font-medium capitalize" style={{ color: 'var(--text-base)' }}>
                {order.payment_method || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, onClick }) {
  return (
    <tr className="clickable" onClick={onClick}>
      <td>
        <span className="font-semibold" style={{ color: 'var(--text-base)' }}>
          #{order.id || order.order_number}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
          <Icon icon={Location01Icon} size={13} style={{ color: 'var(--text-muted)' }} />
          <span>{order.city || order.delivery_city || '-'}, {order.state || order.delivery_state || '-'}</span>
        </div>
      </td>
      <td>
        <span style={{ color: 'var(--text-secondary)' }}>
          {order.items_count ?? order.items?.length ?? '-'} item(s)
        </span>
      </td>
      <td>
        <span className="font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
          N{Number(order.total || 0).toLocaleString()}
        </span>
      </td>
      <td><Badge variant={statusVariant(order.status)} dot>{order.status?.replace('_', ' ')}</Badge></td>
      <td>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' }) : '-'}
        </span>
      </td>
    </tr>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiClient.getOrders()
      .then((res) => setOrders(res.data ?? res.orders ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      String(o.id).includes(q) ||
      String(o.order_number ?? '').toLowerCase().includes(q) ||
      (o.city ?? '').toLowerCase().includes(q) ||
      (o.delivery_city ?? '').toLowerCase().includes(q) ||
      (o.buyer_name ?? '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-base)' }}>Orders</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Track all orders placed for your products.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            <Icon icon={Search01Icon} size={14} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="ts-input pl-9 w-52"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`ts-btn-sm capitalize ${statusFilter === s ? 'ts-btn-primary' : 'ts-btn-secondary'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="ts-card overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="ts-skeleton h-12 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-overlay)' }}
            >
              <Icon icon={ShoppingBag01Icon} size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">No orders found</p>
          </div>
        ) : (
          <table className="ts-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Location</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <OrderRow key={o.id ?? o.order_number} order={o} onClick={() => setSelected(o)} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
