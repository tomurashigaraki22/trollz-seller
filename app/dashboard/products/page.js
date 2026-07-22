'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Badge from '@/components/Badge';
import Icon from '@/components/Icon';
import {
  Package01Icon,
  Add01Icon,
  Search01Icon,
  Delete02Icon,
  Edit01Icon,
  Cancel01Icon,
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

function EmptyProducts({ onAdd }) {
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
      <button onClick={onAdd} className="ts-btn-primary ts-btn-sm">
        <Icon icon={Add01Icon} size={15} />
        Add product
      </button>
    </div>
  );
}

function ProductModal({ product, categories, onClose, onSave }) {
  const isEdit = !!product?.id;
  const topCategories = categories.filter((category) => !category.parent_id);
  const initialImages = parseImageUrls(product?.image_url);
  const [form, setForm] = useState({
    name: product?.name ?? '',
    price: product?.price ?? '',
    stock: product?.stock ?? '',
    category: product?.category ?? '',
    subcategory: product?.subcategory ?? '',
    description: product?.description ?? '',
    status: product?.status ?? 'active',
    image_urls: initialImages,
  });
  const currentCategory = topCategories.find((category) => category.category === form.category);
  const childCategories = categories.filter(
    (category) => currentCategory && Number(category.parent_id) === Number(currentCategory.id)
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setCategory = (e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: '' }));

  const handleImageSelect = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setError('');
    setUploading(true);
    try {
      const results = await apiClient.uploadProductImages(files);
      const urls = results.map((res) => res.url || res.data?.url || '').filter(Boolean);
      if (urls.length === 0) throw new Error('Upload did not return a URL');
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...urls].slice(0, 8) }));
    } catch (err) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (url) => {
    setForm((f) => ({ ...f, image_urls: f.image_urls.filter((item) => item !== url) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) { setError('Name and price are required'); return; }
    if (!form.category) { setError('Select a category'); return; }
    const payload = {
      ...form,
      image_url: JSON.stringify(form.image_urls),
    };
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await apiClient.updateProduct(product.id, payload);
      } else {
        await apiClient.createProduct(payload);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl p-6 anim-scale"
        style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-xl)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base" style={{ color: 'var(--text-base)' }}>
            {isEdit ? 'Edit product' : 'New product'}
          </h2>
          <button onClick={onClose} className="ts-btn-ghost ts-btn-sm p-2">
            <Icon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Product name *
              </label>
              <input value={form.name} onChange={set('name')} placeholder="e.g. Classic Tee" className="ts-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Price (N) *
              </label>
              <input type="number" value={form.price} onChange={set('price')} placeholder="5000" className="ts-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Stock quantity
              </label>
              <input type="number" value={form.stock} onChange={set('stock')} placeholder="100" className="ts-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Category *
              </label>
              <select value={form.category} onChange={setCategory} className="ts-input">
                <option value="">Select category</option>
                {topCategories.map((category) => (
                  <option key={category.id} value={category.category}>
                    {category.category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Subcategory
              </label>
              <select value={form.subcategory} onChange={set('subcategory')} className="ts-input" disabled={!form.category || childCategories.length === 0}>
                <option value="">{childCategories.length ? 'Select subcategory' : 'No subcategory'}</option>
                {childCategories.map((category) => (
                  <option key={category.id} value={category.category}>
                    {category.category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Status
              </label>
              <select value={form.status} onChange={set('status')} className="ts-input">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="Short product description..."
                rows={3}
                className="ts-input resize-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Product images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="ts-input"
              />
              {uploading && (
                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Uploading image...
                </p>
              )}
              {form.image_urls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {form.image_urls.map((url) => (
                    <div key={url} className="relative overflow-hidden rounded-xl border border-[var(--border)]">
                      <img src={url} alt="Product preview" className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="ts-btn-secondary flex-1">Cancel</button>
            <button type="submit" className="ts-btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductRow({ product, onEdit, onDelete }) {
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
          <button onClick={() => onEdit(product)} className="ts-btn-ghost ts-btn-sm p-2">
            <Icon icon={Edit01Icon} size={15} />
          </button>
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

function ProductMobileCard({ product, onEdit, onDelete }) {
  const statusVariant =
    product.status === 'active' ? 'success'
    : product.status === 'draft' ? 'warning'
    : 'error';

  return (
    <div className="ts-card p-4 space-y-4">
      <div className="flex gap-3">
        <div
          className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: 'var(--bg-overlay)' }}
        >
          {firstImage(product.image_url) ? (
            <img src={firstImage(product.image_url)} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <Icon icon={Package01Icon} size={18} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-base)' }}>
            {product.name}
          </p>
          {product.category && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}
            </p>
          )}
        </div>
        <Badge variant={statusVariant} dot>{product.status?.replace('_', ' ')}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Price</p>
          <p className="font-bold tabular-nums mt-1" style={{ color: 'var(--primary)' }}>
            N{Number(product.price || 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Stock</p>
          <p className="font-semibold mt-1" style={{ color: Number(product.stock) === 0 ? 'var(--danger-text)' : 'var(--text-base)' }}>
            {product.stock ?? '-'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onEdit(product)} className="ts-btn-secondary ts-btn-sm justify-center">
          <Icon icon={Edit01Icon} size={15} />
          Edit
        </button>
        <button
          onClick={() => onDelete(product)}
          className="ts-btn-ghost ts-btn-sm justify-center"
          style={{ color: 'var(--danger-text)', boxShadow: '0 0 0 1px var(--border)' }}
        >
          <Icon icon={Delete02Icon} size={15} />
          Delete
        </button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  const load = () => {
    setLoading(true);
    apiClient.getProducts()
      .then((res) => setProducts(Array.isArray(res) ? res : (res.data ?? res.products ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    apiClient.getCategories()
      .then((res) => {
        const rows = Array.isArray(res) ? res : (res.data ?? res.categories ?? []);
        setCategories(rows);
      })
      .catch(console.error);
  }, []);

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
        <button onClick={() => setModal('add')} className="ts-btn-primary ts-btn-sm">
          <Icon icon={Add01Icon} size={15} />
          Add product
        </button>
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
          <EmptyProducts onAdd={() => setModal('add')} />
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
                  <ProductRow
                    key={p.id}
                    product={p}
                    onEdit={(p) => setModal(p)}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
