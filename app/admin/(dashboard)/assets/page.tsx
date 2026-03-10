export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import AssetManager from './AssetManager';

export default async function AdminAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; category?: string }>;
}) {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');

  const tenantId = await getTenantId();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const search = params.search || '';
  const categoryFilter = params.category || 'all';

  // 服务端分页查询
  const { data: assets, pagination } = await db.assets.getPaginated(tenantId, {
    page,
    limit: 10,
    categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
    search: search || undefined,
    sort: 'sortOrder',
  });

  const categories = await db.categories.getHierarchical(tenantId);

  const serializedAssets = assets.map((a) => ({ ...a, fileSize: Number(a.fileSize) }));

  return (
    <AssetManager
      initialAssets={serializedAssets}
      categories={categories}
      pagination={pagination}
      initialSearch={search}
      initialCategory={categoryFilter}
    />
  );
}
