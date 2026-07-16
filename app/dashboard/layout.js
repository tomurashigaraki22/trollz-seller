import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-ink-50">
        <Sidebar />
        <main className="lg:pl-64 min-h-screen">
          <div className="max-w-[1200px] mx-auto px-5 py-7 pt-16 lg:pt-7">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

