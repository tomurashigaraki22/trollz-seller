'use client';

export default function AdminError({ error, reset }) {
  const denied = error?.status === 403 || error?.name === 'AuthorizationError';
  return <section className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm"><p className="text-xs font-semibold uppercase tracking-widest text-danger">{denied ? '403 — Access denied' : 'Admin error'}</p><h1 className="mt-3 text-2xl font-black text-ink-900">{denied ? 'You do not have permission to view this section.' : 'This admin section could not load.'}</h1><p className="mt-2 text-sm text-ink-600">Your access is enforced on the server and may differ from another administrator’s.</p><button type="button" onClick={() => reset()} className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Try again</button></section>;
}
