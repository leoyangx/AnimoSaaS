import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminSidebar from '@/components/AdminSidebar';
import { MobileSidebarWrapper } from '@/components/MobileSidebar';
import { CsrfProvider } from '@/components/CsrfProvider';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  return (
    <CsrfProvider>
      <div className="min-h-screen bg-bg-dark flex">
        <MobileSidebarWrapper>
          <AdminSidebar />
        </MobileSidebarWrapper>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pt-16 lg:pt-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </CsrfProvider>
  );
}
