export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import CategoryManager from './CategoryManager';

export default async function AssetCategoriesPage() {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');

  const tenantId = await getTenantId();
  const categories = await db.categories.getHierarchical(tenantId);

  return <CategoryManager initialCategories={JSON.parse(JSON.stringify(categories))} />;
}
