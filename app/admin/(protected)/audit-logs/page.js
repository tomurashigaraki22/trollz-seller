import { requireAdminContext } from '@/lib/admin-session';
import { getAdminAuditLogs } from '@/lib/admin-data';
import { PERMISSIONS } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  await requireAdminContext(PERMISSIONS.AUDIT_LOGS_READ);
  const logs = await getAdminAuditLogs();
  return <section><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Security</p><h1 className="mt-2 text-2xl font-black text-ink-900">Audit log</h1><p className="mt-1 text-sm text-ink-600">Privileged actions recorded by the admin API.</p><div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-3 py-3">Time</th><th className="px-3 py-3">Actor</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Resource</th><th className="px-3 py-3">Request</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-t border-ink-100"><td className="whitespace-nowrap px-3 py-3 text-xs">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td><td className="px-3 py-3"><p className="font-semibold">{log.actor_name || 'System'}</p><p className="text-xs text-ink-500">{log.actor_email || ''}</p></td><td className="px-3 py-3 font-semibold">{log.action}</td><td className="px-3 py-3 text-xs">{log.resource_type || '—'}{log.resource_id ? ` #${log.resource_id}` : ''}</td><td className="px-3 py-3 text-xs text-ink-500">{log.request_id || '—'}</td></tr>)}</tbody></table></div></section>;
}
