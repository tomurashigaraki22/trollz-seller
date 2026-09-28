'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { qaImg } from '@/lib/debugImages';

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

function statusClass(status) {
  if (status === 'active') return 'text-[var(--success-text)]';
  if (status === 'failed' || status === 'rejected') return 'text-[var(--danger-text)]';
  return 'text-[var(--warning-text)]';
}

export default function BannerAdsPage() {
  const [plans, setPlans] = useState([]);
  const [ads, setAds] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [plansResponse, adsResponse] = await Promise.all([
        apiClient.getBannerAdPlans(),
        apiClient.getBannerAds(),
      ]);
      const nextPlans = plansResponse.data?.plans ?? [];
      setPlans(nextPlans);
      setAds(adsResponse.data?.ads ?? []);
      setSelectedPlan((current) => current || nextPlans[0]?.code || '');
    } catch (loadError) {
      setError(loadError.message || 'Could not load banner advertising.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () => plans.find((plan) => plan.code === selectedPlan),
    [plans, selectedPlan]
  );

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setMessage('');
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const response = await apiClient.uploadBannerAdImage(file);
      setImageUrl(response.data?.url || '');
      setMessage('Banner uploaded. Choose a period and continue to payment.');
    } catch (uploadError) {
      setImageUrl('');
      setError(uploadError.message || 'Banner upload failed.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handlePay(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!imageUrl) {
      setError('Upload your banner image first.');
      return;
    }
    if (!selectedPlan) {
      setError('Choose an advertising period first.');
      return;
    }
    setPaying(true);
    try {
      const response = await apiClient.createBannerAdCheckout({
        plan_code: selectedPlan,
        image_url: imageUrl,
        target_url: targetUrl.trim() || undefined,
      });
      const paymentLink = response.data?.payment_link;
      if (!paymentLink) throw new Error('No payment link was returned.');
      window.location.assign(paymentLink);
    } catch (paymentError) {
      setError(paymentError.message || 'Could not start banner payment.');
      setPaying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
          Promotion
        </p>
        <h1 className="mt-2 text-2xl font-black" style={{ color: 'var(--text-base)' }}>
          Homepage banner ads
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Put your store in front of shoppers on the Trollz Store landing page. Your ad starts after payment verification.
        </p>
      </div>

      {error && <p className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>{error}</p>}
      {message && <p className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>{message}</p>}

      <form onSubmit={handlePay} className="max-w-3xl space-y-5 rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h2 className="font-bold" style={{ color: 'var(--text-base)' }}>Choose a period</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {plans.map((plan) => (
              <label key={plan.code} className="cursor-pointer rounded-xl border p-4" style={{ borderColor: selectedPlan === plan.code ? 'var(--primary)' : 'var(--border)' }}>
                <input type="radio" name="banner-plan" value={plan.code} checked={selectedPlan === plan.code} onChange={() => setSelectedPlan(plan.code)} className="sr-only" />
                <span className="block text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{plan.name}</span>
                <span className="mt-2 block text-lg font-black" style={{ color: 'var(--primary)' }}>{money.format(Number(plan.price || 0))}</span>
                <span className="mt-1 block text-xs" style={{ color: 'var(--text-muted)' }}>{plan.duration_days} days</span>
              </label>
            ))}
          </div>
          {!loading && plans.length === 0 && <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>Banner ad periods are not available yet.</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Banner artwork</label>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Use a clear JPEG, PNG, WEBP, or AVIF image under 5MB. A wide banner works best.</p>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleImageChange} disabled={uploading} className="ts-input mt-3" />
          {previewUrl && <img src={qaImg(previewUrl)} alt="Banner preview" className="mt-3 aspect-[16/5] w-full rounded-xl object-cover" />}
          {uploading && <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>Uploading banner...</p>}
        </div>

        <label className="block text-sm font-semibold" style={{ color: 'var(--text-base)' }}>
          Destination link (optional)
          <input type="url" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="https://your-store-or-product-link" className="ts-input mt-2" />
        </label>

        <button type="submit" disabled={loading || uploading || paying || !selected || Number(selected?.price || 0) <= 0 || !imageUrl} className="ts-btn ts-btn-primary">
          {paying ? 'Opening payment...' : selected && Number(selected.price || 0) > 0 ? `Pay ${money.format(Number(selected.price))}` : 'Awaiting admin pricing'}
        </button>
      </form>

      <section className="max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-base)' }}>Your banner ads</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Paid ads remain visible until their period expires or an admin pauses them.</p>
          </div>
          <button type="button" onClick={load} className="ts-btn ts-btn-secondary ts-btn-sm">Refresh</button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {ads.map((ad) => (
            <div key={ad.id} className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: 'var(--border)' }}>
              <img src={qaImg(ad.image_url)} alt="Seller banner ad" className="aspect-[16/5] w-full object-cover" />
              <div className="space-y-1 p-4 text-sm">
                <p className="font-semibold" style={{ color: 'var(--text-base)' }}>{ad.plan_name || ad.plan_code} · {money.format(Number(ad.amount || 0))}</p>
                <p className={statusClass(ad.status)}>Status: {ad.status}</p>
                {ad.expires_at && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Expires: {new Date(ad.expires_at).toLocaleString()}</p>}
              </div>
            </div>
          ))}
          {!loading && ads.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You have not purchased a banner ad yet.</p>}
        </div>
      </section>
    </div>
  );
}
