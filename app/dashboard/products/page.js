'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import Badge from '@/components/Badge';
import Icon from '@/components/Icon';
import {
  Package01Icon,
  Add01Icon,
  Search01Icon,
  Delete02Icon,
  Edit01Icon,
} from '@hugeicons/core-free-icons';

function parseImageUrls(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}
  return [value].filter(Boolean);
}

function firstImage(value) {
  return parseImageUrls(value)[0] || '';
}

function EmptyProducts() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--bg-overlay)', boxShadow: '0 0 0 1px var(--border)' }}
      >
        <Icon icon={Package01Icon} size={28} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="text-center">
        <p className="font-semibold" style={{ color: 'var(--text-base)' }}>No products yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Add your first product to start selling.
        </p>
      </div>
      <Link href="/dashboard/products/new" className="ts-btn-primary ts-btn-sm">
        <Icon icon={Add01Icon} size={15} />
        Add product
      </Link>
    </div>
  );
}

function ProductRow({ product, onDelete }) {
  const statusVariant =
    product.status === 'active' ? 'success'
    : product.status === 'draft' ? 'warning'
    : 'error';

  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
            style={{ background: 'var(--bg-overlay)' }}
          >
            {firstImage(product.image_url) ? (
              <img src={firstImage(product.image_url)} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Icon icon={Package01Icon} size={16} style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-base)' }}>
              {product.name}
            </p>
            {product.category && (
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}
              </p>
            )}
          </div>
        </div>
      </td>
      <td>
        <span className="font-semibold tabular-nums" style={{ color: 'var(--primary)' }}>
          N{Number(product.price || 0).toLocaleString()}
        </span>
      </td>
      <td>
        <span style={{ color: Number(product.stock) === 0 ? 'var(--danger-text)' : 'var(--text-base)' }}>
          {product.stock ?? '-'}
        </span>
      </td>
      <td>
        <Badge variant={statusVariant} dot>{product.status?.replace('_', ' ')}</Badge>
      </td>
      <td>
        <div className="flex items-center gap-1">
          <Link href={`/dashboard/products/${product.id}/edit`} className="ts-btn-ghost ts-btn-sm p-2">
            <Icon icon={Edit01Icon} size={15} />
          </Link>
          <button
            onClick={() => onDelete(product)}
            className="ts-btn-ghost ts-btn-sm p-2"
            style={{ color: 'var(--danger-text)' }}
          >
            <Icon icon={Delete02Icon} size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    apiClient.getProducts()
      .then((res) => setProducts(Array.isArray(res) ? res : (res.data ?? res.products ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await apiClient.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-base)' }}>Products</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage everything you are selling on Trollz.
          </p>
        </div>
        <Link href="/dashboard/products/new" className="ts-btn-primary ts-btn-sm">
          <Icon icon={Add01Icon} size={15} />
          Add product
        </Link>
      </div>

      <div className="relative max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
          <Icon icon={Search01Icon} size={15} />
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="ts-input pl-9"
        />
      </div>

      <div className="ts-card">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="ts-skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyProducts />
        ) : (
          <div className="overflow-x-auto">
            <table className="ts-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <ProductRow key={p.id} product={p} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
