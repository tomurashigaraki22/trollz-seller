'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProductEditForm({ product }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    item: product.item || '',
    category: product.category || '',
    subcategory: product.subcategory || '',
    price: product.price ?? '',
    discount: product.discount ?? 0,
    qty: product.qty ?? 0,
    stock: product.stock ?? product.qty ?? 0,
    description: product.description || '',
    size_type: product.size_type || 'none',
    size_options: product.size_options || '',
    color_options: product.color_options || '',
    is_flash_sale: Boolean(product.is_flash_sale),
  });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update product.');
      setOpen(false);
      router.refresh();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return <div><button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">{open ? 'Close' : 'Edit'}</button>{open && <form onSubmit={submit} className="mt-3 min-w-[280px] rounded-xl border border-ink-200 bg-ink-50 p-3"><div className="grid gap-2"><input required value={form.item} onChange={(event) => update('item', event.target.value)} placeholder="Product name" className="rounded border border-ink-200 px-2 py-1.5 text-xs" /><div className="grid grid-cols-2 gap-2"><input value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Category" className="rounded border border-ink-200 px-2 py-1.5 text-xs" /><input value={form.subcategory} onChange={(event) => update('subcategory', event.target.value)} placeholder="Subcategory" className="rounded border border-ink-200 px-2 py-1.5 text-xs" /></div><div className="grid grid-cols-3 gap-2"><input type="number" min="0" value={form.price} onChange={(event) => update('price', Number(event.target.value))} placeholder="Price" className="rounded border border-ink-200 px-2 py-1.5 text-xs" /><input type="number" min="0" value={form.discount} onChange={(event) => update('discount', Number(event.target.value))} placeholder="Discount" className="rounded border border-ink-200 px-2 py-1.5 text-xs" /><input type="number" min="0" value={form.stock} onChange={(event) => update('stock', Number(event.target.value))} placeholder="Stock" className="rounded border border-ink-200 px-2 py-1.5 text-xs" /></div><select value={form.size_type} onChange={(event) => update('size_type', event.target.value)} className="rounded border border-ink-200 px-2 py-1.5 text-xs"><option value="none">No size selector</option><option value="shoe">Shoe sizes</option><option value="cloth">Clothing sizes</option></select><input value={form.size_options} onChange={(event) => update('size_options', event.target.value)} placeholder="Size options" className="rounded border border-ink-200 px-2 py-1.5 text-xs" /><input value={form.color_options} onChange={(event) => update('color_options', event.target.value)} placeholder="Color options" className="rounded border border-ink-200 px-2 py-1.5 text-xs" /><textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Description" rows={3} className="rounded border border-ink-200 px-2 py-1.5 text-xs" /><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.is_flash_sale} onChange={(event) => update('is_flash_sale', event.target.checked)} /> Flash sale</label></div><button disabled={busy} className="mt-3 rounded bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save changes'}</button></form>}</div>;
}
