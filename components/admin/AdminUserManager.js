'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

function UserRow({ user, roles }) {
  const router = useRouter();
  const [selected, setSelected] = useState(user.roles);
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  async function updateRole(event) {
    event.preventDefault();
    const reason = window.prompt('Reason for changing this admin\'s roles?');
    if (!reason?.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/admin-users/${user.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roleCodes: selected, reason }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update roles.');
      router.refresh();
    } catch (error) { window.alert(error.message); } finally { setBusy(false); }
  }

  async function updateStatus() {
    const reason = window.prompt('Reason for changing this admin\'s access?');
    if (!reason?.trim()) return;
    setStatusBusy(true);
    try {
      const response = await fetch(`/api/admin/admin-users/${user.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: Number(user.admin_active) === 1 ? 0 : 1, reason }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update status.');
      router.refresh();
    } catch (error) { window.alert(error.message); } finally { setStatusBusy(false); }
  }

  return <tr className="border-t border-ink-100 align-top"><td className="px-3 py-3"><p className="font-semibold text-ink-900">{user.name}</p><p className="text-xs text-ink-500">{user.email}</p></td><td className="px-3 py-3"><div className="grid gap-1 sm:grid-cols-2">{roles.map((role) => <label key={role.code} className="text-xs"><input type="checkbox" checked={selected.includes(role.code)} onChange={() => setSelected((current) => current.includes(role.code) ? current.filter((code) => code !== role.code) : [...current, role.code])} /> <span className="ml-1">{role.code}</span></label>)}</div><button onClick={updateRole} disabled={busy || !selected.length} className="mt-2 rounded border border-brand-200 px-2 py-1 text-xs font-semibold text-brand-700 disabled:opacity-50">{busy ? 'Saving…' : 'Save roles'}</button></td><td className="px-3 py-3 text-xs">{Number(user.admin_active) === 1 ? 'Active' : 'Inactive'}</td><td className="px-3 py-3"><button onClick={updateStatus} disabled={statusBusy} className="rounded border border-ink-200 px-2 py-1 text-xs font-semibold text-ink-700 disabled:opacity-50">{statusBusy ? 'Saving…' : Number(user.admin_active) === 1 ? 'Deactivate' : 'Activate'}</button></td></tr>;
}

export default function AdminUserManager({ users, roles, canManage }) {
  return <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-3 py-3">Admin</th><th className="px-3 py-3">Roles</th><th className="px-3 py-3">Status</th>{canManage && <th className="px-3 py-3">Action</th>}</tr></thead><tbody>{users.map((user) => canManage ? <UserRow key={user.id} user={user} roles={roles} /> : <tr key={user.id} className="border-t border-ink-100"><td className="px-3 py-3"><p className="font-semibold text-ink-900">{user.name}</p><p className="text-xs text-ink-500">{user.email}</p></td><td className="px-3 py-3 text-xs">{user.roles.join(', ') || '—'}</td><td className="px-3 py-3 text-xs">{Number(user.admin_active) === 1 ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div>;
}
