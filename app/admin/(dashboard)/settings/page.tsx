export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import AdminSidebar from '../AdminSidebar';
import { BrandingForm } from './BrandingForm';

export default async function AdminSettingsPage() {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');

  const tenantId = await getTenantId();
  const config = await db.config.get(tenantId);

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <BrandingForm initialConfig={JSON.parse(JSON.stringify(config))} />
        </div>
      </main>
    </div>
  );
}
