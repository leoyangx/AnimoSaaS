import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantId } from '@/lib/tenant-context';
import { formatDate } from '@/lib/utils';
import { Activity, Shield } from 'lucide-react';

export default async function AdminLogsPage() {
  const session = await getSession('admin');

  if (!session || (session as any).role !== 'admin') {
    redirect('/admin/login');
  }

  const tenantId = await getTenantId();
  const logs = await db.logs.getAll(tenantId, 100);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <Activity className="text-brand-primary" />
            操作日志
          </h1>
          <p className="text-zinc-500 text-sm">
            记录所有管理员的关键操作，确保系统安全可追溯。
          </p>
        </div>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  时间
                </th>
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  管理员
                </th>
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  操作类型
                </th>
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  操作详情
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    暂无操作记录。
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-brand-secondary" />
                        <span className="text-sm font-medium text-white/90">
                          {log.adminEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${
                          log.action.includes('DELETE')
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : log.action.includes('CREATE')
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
