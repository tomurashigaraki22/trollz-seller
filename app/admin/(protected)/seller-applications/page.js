import { requireAdminContext } from '@/lib/admin-session';
import { getAdminSellerApplications } from '@/lib/admin-data';
import { PERMISSIONS } from '@/lib/rbac';
import AdminActionButton from '@/components/admin/AdminActionButton';

export const dynamic = 'force-dynamic';

export default async function AdminApplicationsPage() {
  const { admin } = await requireAdminContext(PERMISSIONS.SELLER_APPLICATIONS_READ);
  const applications = await getAdminSellerApplications();
  const canReview = admin.permissions.includes('*') || admin.permissions.includes(PERMISSIONS.SELLER_APPLICATIONS_REVIEW);
  return <section><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Seller onboarding</p><h1 className="mt-2 text-2xl font-black text-ink-900">Seller applications</h1><div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-3 py-3">Applicant</th><th className="px-3 py-3">Business</th><th className="px-3 py-3">Agreement</th><th className="px-3 py-3">Status</th>{canReview && <th className="px-3 py-3">Review</th>}</tr></thead><tbody>{applications.map((application) => <tr key={application.id} className="border-t border-ink-100"><td className="px-3 py-3"><p className="font-semibold">{application.full_name}</p><p className="text-xs text-ink-500">{application.email}</p></td><td className="px-3 py-3">{application.business_name}</td><td className="px-3 py-3">{Number(application.agreement_accepted) === 1 ? `Accepted${application.signature_name ? ` — ${application.signature_name}` : ''}` : 'Missing'}</td><td className="px-3 py-3">{application.verification_status}</td>{canReview && <td className="flex gap-2 px-3 py-3"><AdminActionButton endpoint={`/api/admin/seller-applications/${application.id}`} body={{ verification_status: 'approved' }} label="Approve" /><AdminActionButton endpoint={`/api/admin/seller-applications/${application.id}`} body={{ verification_status: 'rejected' }} label="Reject" confirmMessage="Reject this seller application?" /></td>}</tr>)}</tbody></table></div></section>;
}
