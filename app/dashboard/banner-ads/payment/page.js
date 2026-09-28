'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function BannerAdPaymentPage() {
  const [state, setState] = useState('checking');
  const [message, setMessage] = useState('Confirming your banner payment...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get('tx_ref') || params.get('trxref');
    if (!txRef) {
      setState('error');
      setMessage('The payment reference was not returned. Open Banner ads and check your ad status.');
      return;
    }

    apiClient.verifyBannerAdPayment(txRef)
      .then(() => {
        setState('success');
        setMessage('Payment verified. Your banner ad is now active.');
      })
      .catch((error) => {
        setState('error');
        setMessage(error.message || 'We could not verify this payment yet.');
      });
  }, []);

  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8 text-center" style={{ borderColor: 'var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Banner advertising</p>
      <h1 className="mt-3 text-2xl font-black" style={{ color: 'var(--text-base)' }}>
        {state === 'checking' ? 'Checking payment' : state === 'success' ? 'Payment complete' : 'Payment needs attention'}
      </h1>
      <p className="mt-3 text-sm" style={{ color: state === 'error' ? 'var(--danger-text)' : 'var(--text-secondary)' }}>{message}</p>
      <Link href="/dashboard/banner-ads" className="ts-btn ts-btn-primary mt-6">Back to banner ads</Link>
    </div>
  );
}
