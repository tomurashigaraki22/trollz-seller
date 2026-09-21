'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminActionButton({ endpoint, method = 'PATCH', body, label, confirmMessage, className = '' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'content-type': 'application/json' },
        body: body == null ? undefined : JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Request failed.');
      router.refresh();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <button type="button" disabled={busy} onClick={submit} className={`rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50 ${className}`}>{busy ? 'Saving…' : label}</button>;
}
