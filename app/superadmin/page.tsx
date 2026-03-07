import { prisma } from '@/lib/prisma';
import { Building2, Users, Package, HardDrive } from 'lucide-react';
import Link from 'next/link';

export default async function SuperAdminDashboard() {
  // 统计数据
  const [tenantCount, userCount, assetCount, activeTenants] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.asset.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { status: 'active' } }),
  ]);

  // 最近创建的租户
  const recentTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      _count: { select: { users: true, assets: true } },
    },
  });

  const stats = [
    { label: '总租户数', value: tenantCount, icon: Building2, color: 'amber' },
    { label: '活跃租户', value: activeTenants, icon: Building2, color: 'green' },
    { label: '总用户数', value: userCount, icon: Users, color: 'blue' },
    { label: '总资产数', value: assetCount, icon: Package, color: 'purple' },
  ];

  const colorMap: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">平台概览</h1>
        <p className="text-zinc-500 mt-1">AnimoSaaS 多租户平台管理</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center ${colorMap[stat.color]}`}
              >
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 最近租户 */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">最近租户</h2>
          <Link
            href="/superadmin/tenants"
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            查看全部
          </Link>
        </div>
        <div className="divide-y divide-zinc-800">
          {recentTenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={`/superadmin/tenants/${tenant.id}`}
              className="flex items-center justify-between p-5 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-sm">
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{tenant.name}</p>
                  <p className="text-xs text-zinc-500 font-mono">{tenant.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs text-zinc-500">
                <span>{tenant._count.users} 用户</span>
                <span>{tenant._count.assets} 资产</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tenant.status === 'active'
                      ? 'bg-green-500/10 text-green-500'
                      : tenant.status === 'suspended'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {tenant.status === 'active' ? '活跃' : tenant.status === 'suspended' ? '已停用' : '已删除'}
                </span>
              </div>
            </Link>
          ))}
          {recentTenants.length === 0 && (
            <div className="p-10 text-center text-zinc-500">
              暂无租户，请先创建一个租户
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
