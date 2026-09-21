import { requireAdminContext } from '@/lib/admin-session';
import { getAdminOrders } from '@/lib/admin-data';
import { PERMISSIONS } from '@/lib/rbac';
import AdminActionButton from '@/components/admin/AdminActionButton';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const { admin } = await requireAdminContext(PERMISSIONS.ORDERS_READ);
  const orders = await getAdminOrders();
  const canUpdate = admin.permissions.includes('*') || admin.permissions.includes(PERMISSIONS.ORDERS_UPDATE_STATUS);
  return <section><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Fulfilment</p><h1 className="mt-2 text-2xl font-black text-ink-900">Orders</h1><div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-3 py-3">Order</th><th className="px-3 py-3">Buyer</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th>{canUpdate && <th className="px-3 py-3">Action</th>}</tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t border-ink-100"><td className="px-3 py-3 font-semibold">{order.order_number || `#${order.id}`}</td><td className="px-3 py-3">{order.buyer_name || '—'}<div className="text-xs text-ink-500">{order.buyer_email || ''}</div></td><td className="px-3 py-3">₦{Number(order.total_amount || 0).toLocaleString()}</td><td className="px-3 py-3">{order.order_status}</td>{canUpdate && <td className="px-3 py-3"><AdminActionButton endpoint={`/api/admin/orders/${order.id}`} body={{ order_status: order.order_status === 'pending' ? 'processing' : order.order_status === 'processing' ? 'shipped' : order.order_status === 'shipped' ? 'delivered' : order.order_status }} label="Advance" /></td>}</tr>)}</tbody></table></div></section>;
}
