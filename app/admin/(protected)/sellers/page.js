import { requireAdminContext } from '@/lib/admin-session';
import { getAdminSellers } from '@/lib/admin-data';
import { PERMISSIONS } from '@/lib/rbac';
import AdminActionButton from '@/components/admin/AdminActionButton';

export const dynamic = 'force-dynamic';

export default async function AdminSellersPage() {
  const { admin } = await requireAdminContext(PERMISSIONS.SELLERS_READ);
  const sellers = await getAdminSellers();
  const canManage = admin.permissions.includes('*') || admin.permissions.includes(PERMISSIONS.SELLERS_MANAGE);
  return <section><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Marketplace</p><h1 className="mt-2 text-2xl font-black text-ink-900">Sellers</h1><div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-3 py-3">Seller</th><th className="px-3 py-3">Products</th><th className="px-3 py-3">Orders</th><th className="px-3 py-3">Status</th>{canManage && <th className="px-3 py-3">Action</th>}</tr></thead><tbody>{sellers.map((seller) => <tr key={seller.id} className="border-t border-ink-100"><td className="px-3 py-3"><p className="font-semibold">{seller.name}</p><p className="text-xs text-ink-500">{seller.email}</p></td><td className="px-3 py-3">{seller.product_count}</td><td className="px-3 py-3">{seller.order_count}</td><td className="px-3 py-3">{Number(seller.status) === 1 ? 'Active' : 'Inactive'}</td>{canManage && <td className="px-3 py-3"><AdminActionButton endpoint={`/api/admin/sellers/${seller.id}`} body={{ status: Number(seller.status) === 1 ? 0 : 1 }} label={Number(seller.status) === 1 ? 'Suspend' : 'Activate'} confirmMessage={Number(seller.status) === 1 ? 'Suspend this seller?' : undefined} /></td>}</tr>)}</tbody></table></div></section>;
}
