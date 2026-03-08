export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import { NavigationManagement } from './NavigationManagement';

export default async function NavigationPage() {
  const tenantId = await getTenantId();
  const items = await db.navigation.getAll(tenantId);
  return <NavigationManagement initialItems={JSON.parse(JSON.stringify(items))} />;
}
