import AdminSidebar from '@/components/AdminSidebar';
import { MobileSidebarWrapper } from '@/components/MobileSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-dark flex">
      <MobileSidebarWrapper>
        <AdminSidebar />
      </MobileSidebarWrapper>
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto pt-16 lg:pt-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
