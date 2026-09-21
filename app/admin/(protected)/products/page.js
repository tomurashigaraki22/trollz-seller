import { requireAdminContext } from '@/lib/admin-session';
import { getAdminProducts } from '@/lib/admin-data';
import { PERMISSIONS } from '@/lib/rbac';
import AdminActionButton from '@/components/admin/AdminActionButton';
import ProductEditForm from '@/components/admin/ProductEditForm';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const { admin } = await requireAdminContext(PERMISSIONS.PRODUCTS_READ);
  const products = await getAdminProducts();
  const canEdit = admin.permissions.includes('*') || admin.permissions.includes(PERMISSIONS.PRODUCTS_UPDATE);
  const canDelete = admin.permissions.includes('*') || admin.permissions.includes(PERMISSIONS.PRODUCTS_DELETE);
  return <section><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Catalog</p><h1 className="mt-2 text-2xl font-black text-ink-900">Products</h1><p className="mt-1 text-sm text-ink-600">Catalog controls are shown only when your role grants the matching permission.</p><div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-3 py-3">Product</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th>{(canEdit || canDelete) && <th className="px-3 py-3">Actions</th>}</tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-t border-ink-100"><td className="px-3 py-3 font-semibold text-ink-900">{product.item}<span className="ml-2 text-xs font-normal text-ink-400">#{product.id}</span></td><td className="px-3 py-3">{product.category} / {product.subcategory}</td><td className="px-3 py-3">₦{Number(product.price || 0).toLocaleString()}</td><td className="px-3 py-3">{product.stock ?? product.qty ?? 0}</td>{(canEdit || canDelete) && <td className="px-3 py-3"><div className="flex flex-wrap gap-2">{canEdit && <ProductEditForm product={product} />}{canDelete && <AdminActionButton endpoint={`/api/admin/products/${product.id}`} method="DELETE" label="Delete" confirmMessage={`Delete ${product.item}?`} className="border-danger/30 text-danger hover:bg-danger/5" />}</div></td>}</tr>)}</tbody></table></div></section>;
}
