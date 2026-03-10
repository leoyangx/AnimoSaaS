export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import NavigationManager from './NavigationManager';

export default async function NavigationPage() {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');

  const tenantId = await getTenantId();
  const items = await db.navigation.getAll(tenantId);
  const categories = await db.categories.getHierarchical(tenantId);

  return (
    <NavigationManager
      initialItems={JSON.parse(JSON.stringify(items))}
      categories={categories}
    />
  );
}
