import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import AdminSidebar from '../AdminSidebar';
import AssetManager from './AssetManager';

export default async function AdminAssetsPage() {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') redirect('/admin/login');

  const tenantId = await getTenantId();
  const assets = await db.assets.getAll(tenantId);
  const categories = await db.categories.getAll(tenantId);

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <AssetManager
          initialAssets={JSON.parse(JSON.stringify(assets))}
          categories={JSON.parse(JSON.stringify(categories))}
        />
      </main>
    </div>
  );
}
