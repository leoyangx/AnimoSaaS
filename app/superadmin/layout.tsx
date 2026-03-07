import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import { MobileSidebarWrapper } from '@/components/MobileSidebar';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession('superadmin');
  if (!session || (session as any).role !== 'superadmin') {
    redirect('/superadmin/login');
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <MobileSidebarWrapper>
        <SuperAdminSidebar />
      </MobileSidebarWrapper>
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto pt-16 lg:pt-8">{children}</main>
    </div>
  );
}
