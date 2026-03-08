export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import AdminSidebar from '../AdminSidebar';
import { Search } from 'lucide-react';
import { UserTable } from './UserTable';
import { User } from '@/lib/types';

export default async function AdminUsersPage() {
  const session = await getSession('admin');
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');

  const tenantId = await getTenantId();
  const allUsers = await db.users.getAll(tenantId);
  const users = allUsers.filter((u: User) => u.role === 'STUDENT');

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">学员管理</h1>
              <p className="text-zinc-500 text-sm">管理所有注册学员的权限与状态。</p>
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />
              <input type="text" placeholder="搜索学员..." className="glass-input pl-12 w-64" />
            </div>
          </header>

          <UserTable initialUsers={users} />
        </div>
      </main>
    </div>
  );
}
