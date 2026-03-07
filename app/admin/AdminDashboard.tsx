'use client';

import { useState } from 'react';
import {
  Users,
  Package,
  Download,
  Key,
  Plus,
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  DownloadCloud,
  TrendingUp,
  Activity,
  Settings,
  Home,
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  LazyAreaChart as AreaChart,
  LazyArea as Area,
  LazyXAxis as XAxis,
  LazyYAxis as YAxis,
  LazyCartesianGrid as CartesianGrid,
  LazyTooltip as Tooltip,
  LazyResponsiveContainer as ResponsiveContainer,
} from '@/components/LazyCharts';

export default function AdminDashboard({
  stats,
  users,
  codes,
  config,
  chartData: initialChartData,
  adminLogs = [],
}: any) {
  const router = useRouter();

  // Use passed chart data or fallback to mock if not provided
  const chartData = initialChartData || [
    { name: '周一', downloads: 400, users: 240 },
    { name: '周二', downloads: 300, users: 139 },
    { name: '周三', downloads: 200, users: 980 },
    { name: '周四', downloads: 278, users: 390 },
    { name: '周五', downloads: 189, users: 480 },
    { name: '周六', downloads: 239, users: 380 },
    { name: '周日', downloads: 349, users: 430 },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Print-only Header */}
      <div className="hidden print:block mb-10 border-b-2 border-black pb-6">
        <h1 className="text-4xl font-black uppercase tracking-tighter">AnimoSaaS 系统运行报告</h1>
        <p className="text-sm font-mono mt-2">生成时间: {new Date().toLocaleString('zh-CN')}</p>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-gradient-white">
            管理概览
          </h1>
          <p className="text-zinc-500 text-sm mt-1">欢迎回来，管理员。这是您系统的实时运行数据。</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              window.scrollTo(0, 0);
              setTimeout(() => window.print(), 100);
            }}
            className="glass-panel px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            导出报告
          </button>
          <button
            onClick={() => router.push('/admin/assets')}
            className="cyber-button text-[10px] flex items-center gap-2"
          >
            <Plus size={14} />
            添加素材
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: '总学员',
            value: stats.totalUsers,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            growth: '+12%',
          },
          {
            label: '总素材',
            value: stats.totalAssets,
            icon: Package,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            growth: '+5',
          },
          {
            label: '累计下载',
            value: stats.totalDownloads,
            icon: Download,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            growth: '+28%',
          },
          {
            label: '待用邀请码',
            value: stats.unusedCodes,
            icon: Key,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10',
            growth: '-2',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                  stat.growth.startsWith('+')
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                )}
              >
                {stat.growth}
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className={cn('p-3 rounded-xl transition-colors', stat.bg, stat.color)}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="text-3xl font-display font-black mb-1 group-hover:text-brand-primary transition-colors">
              {stat.value}
            </div>
            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-3 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-brand-primary rounded-full" />
              <h3 className="font-display font-bold text-lg">业务增长趋势</h3>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-brand-primary text-black text-[10px] font-bold uppercase tracking-wider">
                下载量
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10">
                注册量
              </button>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="downloads"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDownloads)"
                  name="下载量"
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  name="活跃用户"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Status & Quick Actions */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-display font-bold text-sm mb-6 flex items-center gap-2">
              <Activity size={16} className="text-brand-primary" />
              系统健康度
            </h3>
            <div className="space-y-4">
              {[
                { label: '服务器状态', status: '运行中', color: 'text-emerald-400' },
                { label: '数据库连接', status: '正常', color: 'text-emerald-400' },
                { label: '存储引擎', status: '已挂载', color: 'text-emerald-400' },
                { label: 'SSL 证书', status: '有效', color: 'text-emerald-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{item.label}</span>
                  <span
                    className={cn('text-[10px] font-bold uppercase tracking-wider', item.color)}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">存储空间已用</span>
                <span className="text-xs font-mono text-white/80">64%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary w-[64%]" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-display font-bold text-sm mb-6">快捷操作</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/admin/assets')}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center group"
              >
                <Plus
                  size={16}
                  className="mx-auto mb-2 text-zinc-400 group-hover:text-brand-primary transition-colors"
                />
                <span className="text-[10px] font-bold text-zinc-500 group-hover:text-white">
                  发布素材
                </span>
              </button>
              <button
                onClick={() => router.push('/admin/codes')}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center group"
              >
                <Key
                  size={16}
                  className="mx-auto mb-2 text-zinc-400 group-hover:text-brand-primary transition-colors"
                />
                <span className="text-[10px] font-bold text-zinc-500 group-hover:text-white">
                  生成码
                </span>
              </button>
              <button
                onClick={() => router.push('/admin/settings')}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center group"
              >
                <Settings
                  size={16}
                  className="mx-auto mb-2 text-zinc-400 group-hover:text-brand-primary transition-colors"
                />
                <span className="text-[10px] font-bold text-zinc-500 group-hover:text-white">
                  系统设置
                </span>
              </button>
              <button
                onClick={() => window.open('/', '_blank')}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center group"
              >
                <Home
                  size={16}
                  className="mx-auto mb-2 text-zinc-400 group-hover:text-brand-primary transition-colors"
                />
                <span className="text-[10px] font-bold text-zinc-500 group-hover:text-white">
                  预览前台
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Users */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-bold text-lg">最新注册学员</h3>
            <button
              onClick={() => router.push('/admin/users')}
              className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:underline"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-6">
            {users.slice(0, 5).map((user: any) => (
              <div key={user.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center text-zinc-400 font-bold group-hover:border-brand-primary/30 transition-all">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white/90">
                      {user.email.split('@')[0]}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
                    学员
                  </span>
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="text-zinc-600 hover:text-white transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invitation Codes */}
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Key size={20} className="text-brand-secondary" />
              <h3 className="font-display font-bold text-lg">邀请码实时状态</h3>
            </div>
            <button
              onClick={() => router.push('/admin/codes')}
              className="text-[10px] font-bold uppercase tracking-widest bg-brand-primary/10 text-brand-primary px-4 py-1.5 rounded-full border border-brand-primary/20 hover:bg-brand-primary/20 transition-all"
            >
              进入管理
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {codes.slice(0, 6).map((code: any) => (
              <div
                key={code.code}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-zinc-500 group-hover:text-brand-primary transition-colors">
                    <Key size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-white/80">{code.code}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                      {code.status === 'unused'
                        ? '待使用'
                        : `使用者: ${code.usedBy?.substring(0, 8)}...`}
                    </span>
                  </div>
                </div>
                {code.status === 'unused' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-brand-primary uppercase">可用</span>
                    <span className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase">已用</span>
                    <span className="w-2 h-2 rounded-full bg-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Storage Config Preview */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <DownloadCloud className="text-brand-secondary" />
            <h3 className="font-display font-bold text-lg">存储引擎状态</h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            已连接
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">
              驱动程序
            </div>
            <div className="font-mono font-bold text-sm text-white/90">
              {[
                config.alistUrl && 'AList',
                config.pan123Token && '123网盘',
                config.juheUrl && '聚合网盘',
              ]
                .filter(Boolean)
                .join(' / ') || '未配置'}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">
              主节点
            </div>
            <div className="font-mono font-bold text-sm text-white/90 truncate">
              {config.alistUrl || config.juheUrl || 'Local'}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">
              API 响应
            </div>
            <div className="font-mono font-bold text-sm text-brand-primary">正常</div>
          </div>
        </div>
      </div>

      {/* Operation Logs */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-brand-primary" />
            <h3 className="font-display font-bold text-lg">最近操作日志</h3>
          </div>
          <button
            onClick={() => router.push('/admin/logs')}
            className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:underline"
          >
            查看完整日志
          </button>
        </div>
        <div className="table-responsive">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  时间
                </th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  管理员
                </th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  操作
                </th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  详情
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {adminLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500 text-sm">
                    暂无操作记录
                  </td>
                </tr>
              ) : (
                adminLogs.map((log: any) => (
                  <tr key={log.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 text-xs font-mono text-zinc-500">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-4 text-xs font-bold text-white/80">{log.adminEmail}</td>
                    <td className="py-4">
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider',
                          log.action.includes('DELETE')
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : log.action.includes('CREATE')
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        )}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-zinc-400 max-w-md truncate">{log.details}</td>
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
