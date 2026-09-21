import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/admin-session';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }) {
  const context = await getAdminContext();
  if (!context) redirect('/admin/login');
  return <AdminShell admin={context.admin}>{children}</AdminShell>;
}
