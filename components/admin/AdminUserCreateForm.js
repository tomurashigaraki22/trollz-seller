'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const initialForm = { name: '', email: '', phone: '', password: '', reason: '', roleCodes: [] };

export default function AdminUserCreateForm({ roles }) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);

  function toggleRole(code) {
    setForm((current) => ({ ...current, roleCodes: current.roleCodes.includes(code) ? current.roleCodes.filter((item) => item !== code) : [...current.roleCodes, code] }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.roleCodes.length) return window.alert('Select at least one role.');
    setBusy(true);
    try {
      const response = await fetch('/api/admin/admin-users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create admin account.');
      setForm(initialForm);
      router.refresh();
      window.alert('Admin account created. Give the new administrator their email and password securely.');
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="mb-6 rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-base font-bold text-ink-900">Create admin account</h2><p className="mt-1 text-xs text-ink-500">Creates a login using the email and password you provide. Passwords are hashed server-side and never shown in the admin list.</p><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" /><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email address" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" /><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone (optional)" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" /><input required minLength={12} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Temporary password (12+ chars)" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" /></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{roles.map((role) => <label key={role.code} className="text-xs text-ink-700"><input type="checkbox" checked={form.roleCodes.includes(role.code)} onChange={() => toggleRole(role.code)} /> <span className="ml-1">{role.code}</span></label>)}</div><input required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Reason for creating this account" className="mt-4 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" /><button disabled={busy} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Creating…' : 'Create admin account'}</button></form>;
}
