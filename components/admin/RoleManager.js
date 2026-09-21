'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RoleManager({ permissions }) {
  const router = useRouter();
  const [form, setForm] = useState({ code: '', name: '', description: '', reason: '', permissionCodes: [] });
  const [busy, setBusy] = useState(false);
  const grouped = permissions.reduce((groups, permission) => {
    groups[permission.resource] = [...(groups[permission.resource] || []), permission];
    return groups;
  }, {});

  function toggle(code) {
    setForm((current) => ({ ...current, permissionCodes: current.permissionCodes.includes(code) ? current.permissionCodes.filter((item) => item !== code) : [...current.permissionCodes, code] }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch('/api/admin/roles', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create role.');
      setForm({ code: '', name: '', description: '', reason: '', permissionCodes: [] });
      router.refresh();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-base font-bold text-ink-900">Create custom role</h2>
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="role_code" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
      <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Role name" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
      <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
      <input required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Reason for change" className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />
    </div>
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {Object.entries(grouped).map(([resource, items]) => <fieldset key={resource} className="rounded-lg border border-ink-100 p-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wide text-ink-500">{resource}</legend>
        {items.map((permission) => <label key={permission.code} className="mt-2 flex items-start gap-2 text-xs text-ink-700"><input type="checkbox" checked={form.permissionCodes.includes(permission.code)} onChange={() => toggle(permission.code)} /> <span>{permission.code}</span></label>)}
      </fieldset>)}
    </div>
    <button disabled={busy} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Creating…' : 'Create role'}</button>
  </form>;
}
