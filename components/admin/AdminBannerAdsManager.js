'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { qaImg } from '@/lib/debugImages';

const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

export default function AdminBannerAdsManager({ plans: initialPlans = [], ads: initialAds = [] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans.map((plan) => ({ ...plan, price: plan.price ?? 0 })));
  const [ads, setAds] = useState(initialAds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function updatePrice(code, value) {
    setPlans((current) => current.map((plan) => plan.code === code ? { ...plan, price: value } : plan));
  }

  async function savePrices() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/banner-ads', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plans: plans.map((plan) => ({ code: plan.code, price: Number(plan.price) })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save prices.');
      setPlans(result.plans || plans);
      setMessage('Banner ad prices saved.');
      router.refresh();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id, status) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/banner-ads/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update ad.');
      setAds((current) => current.map((ad) => ad.id === id ? { ...ad, status } : ad));
      router.refresh();
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Homepage monetization</p>
        <h1 className="mt-2 text-2xl font-black text-ink-900">Seller banner ads</h1>
        <p className="mt-1 text-sm text-ink-600">Set the price for each paid period and moderate seller banners shown on the landing page.</p>
      </div>

      {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      {message && <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{message}</p>}

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-ink-900">Advertising prices</h2>
            <p className="mt-1 text-xs text-ink-500">Prices are read live by sellers before checkout.</p>
          </div>
          <button type="button" onClick={savePrices} disabled={busy} className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save prices'}</button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <label key={plan.code} className="text-sm font-semibold text-ink-700">
              {plan.name}
              <div className="mt-2 flex items-center rounded-lg border border-ink-200 px-3">
                <span className="text-ink-400">₦</span>
                <input type="number" min="0" step="1" value={plan.price} onChange={(event) => updatePrice(plan.code, event.target.value)} className="w-full border-0 px-2 py-2 text-sm outline-none" />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-3 py-3">Seller</th><th className="px-3 py-3">Period / amount</th><th className="px-3 py-3">Banner</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr></thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} className="border-t border-ink-100 align-top">
                <td className="px-3 py-3"><p className="font-semibold text-ink-900">{ad.seller_name || 'Unknown seller'}</p><p className="text-xs text-ink-500">{ad.seller_email || '—'}</p></td>
                <td className="px-3 py-3">{ad.plan_name || ad.plan_code}<p className="text-xs text-ink-500">{money.format(Number(ad.amount || 0))}</p></td>
                <td className="px-3 py-3"><img src={qaImg(ad.image_url)} alt="Seller banner" className="h-12 w-28 rounded object-cover" /></td>
                <td className="px-3 py-3">{ad.payment_status}</td>
                <td className="px-3 py-3">{ad.status}</td>
                <td className="px-3 py-3"><button type="button" disabled={busy} onClick={() => updateStatus(ad.id, ad.status === 'active' ? 'paused' : 'active')} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 disabled:opacity-50">{ad.status === 'active' ? 'Pause' : 'Activate'}</button>{ad.status !== 'rejected' && <button type="button" disabled={busy} onClick={() => updateStatus(ad.id, 'rejected')} className="ml-2 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger disabled:opacity-50">Reject</button>}</td>
              </tr>
            ))}
            {ads.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-ink-500">No seller banner ads yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
