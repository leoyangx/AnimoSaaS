export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import { StorageForm } from './StorageForm';

export default async function StorageSettingsPage() {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');

  const tenantId = await getTenantId();
  const config = await db.config.get(tenantId);

  return <StorageForm initialConfig={JSON.parse(JSON.stringify(config))} />;
}
