import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import AdminSidebar from '../AdminSidebar';
import CategoryManager from './CategoryManager';

export default async function AssetCategoriesPage() {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') redirect('/admin/login');

  const tenantId = await getTenantId();
  const categories = await db.categories.getHierarchical(tenantId);

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <CategoryManager initialCategories={JSON.parse(JSON.stringify(categories))} />
      </main>
    </div>
  );
}
