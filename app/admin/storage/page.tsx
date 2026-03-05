import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import AdminSidebar from '../AdminSidebar';
import { StorageForm } from './StorageForm';

export default async function StorageSettingsPage() {
  const session = await getSession('admin');
  if (!session || (session as any).role !== 'admin') redirect('/admin/login');

  const config = await db.config.get();

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <StorageForm initialConfig={JSON.parse(JSON.stringify(config))} />
        </div>
      </main>
    </div>
  );
}
