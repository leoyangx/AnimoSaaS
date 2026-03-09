export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import AssetManager from './AssetManager';

export default async function AdminAssetsPage() {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');

  const tenantId = await getTenantId();
  const assets = await db.assets.getAll(tenantId);
  const categories = await db.categories.getAll(tenantId);

  return (
    <AssetManager
      initialAssets={JSON.parse(JSON.stringify(assets))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
