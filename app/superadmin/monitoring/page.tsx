'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, AlertCircle, Info, Cpu, Database, Activity, Users } from 'lucide-react';

interface SystemInfo {
  memory: { rss: number; heapUsed: number; heapTotal: number; unit: string };
  uptime: number;
  nodeVersion: string;
  platform: string;
  pid: number;
}

interface RequestStats {
  total: number;
  errors: number;
  errorRate: string;
  requestsPerHour: number;
  topPaths: { path: string; count: number }[];
  statusDistribution: Record<string, number>;
  uptimeSeconds: number;
}

interface TenantStats {
  total: number;
  active: number;
  suspended: number;
  deleted: number;
  topTenants: { name: string; slug: string; plan: string; users: number; assets: number }[];
}

interface DatabaseStats {
  status: string;
  latencyMs: number;
  records: { users: number; assets: number; logs: number };
}

interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  category: string;
  timestamp: string;
}

interface MonitoringData {
  system: SystemInfo;
  requests: RequestStats;
  tenants: TenantStats;
  database: DatabaseStats;
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [monRes, alertRes] = await Promise.all([
        fetch('/api/superadmin/monitoring'),
        fetch('/api/superadmin/alerts'),
      ]);
      const monData = await monRes.json();
      const alertData = await alertRes.json();

      if (monData.success) setData(monData.data);
      if (alertData.success) setAlerts(alertData.data.alerts);
    } catch (e) {
      console.error('Fetch monitoring data failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}天 ${h}时 ${m}分`;
    if (h > 0) return `${h}时 ${m}分`;
    return `${m}分`;
  };

  const severityIcon = (s: string) => {
    switch (s) {
      case 'critical': return <AlertCircle size={14} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-yellow-500" />;
      default: return <Info size={14} className="text-blue-500" />;
    }
  };

  const severityBg = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-red-500/10 border-red-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto p-10 text-center text-zinc-500">加载中...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">系统监控</h1>
          <p className="text-zinc-500 mt-1">实时系统状态与告警</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            自动刷新 (15s)
          </label>
          <button
            onClick={fetchData}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-xl border ${severityBg(alert.severity)}`}>
              {severityIcon(alert.severity)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{alert.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{alert.message}</p>
              </div>
              <span className="text-[10px] text-zinc-500 whitespace-nowrap">{alert.category}</span>
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          {/* System Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Cpu size={20} className="text-blue-500" />}
              label="内存使用"
              value={`${data.system.memory.heapUsed}MB`}
              sub={`/ ${data.system.memory.heapTotal}MB`}
              color="blue"
            />
            <StatCard
              icon={<Activity size={20} className="text-green-500" />}
              label="运行时间"
              value={formatUptime(data.system.uptime)}
              sub={`PID ${data.system.pid}`}
              color="green"
            />
            <StatCard
              icon={<Database size={20} className="text-purple-500" />}
              label="数据库延迟"
              value={`${data.database.latencyMs}ms`}
              sub={data.database.status}
              color="purple"
            />
            <StatCard
              icon={<Users size={20} className="text-amber-500" />}
              label="活跃租户"
              value={`${data.tenants.active}`}
              sub={`/ ${data.tenants.total} 总计`}
              color="amber"
            />
          </div>

          {/* Request Stats + Memory */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Stats */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">请求统计</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-zinc-500">总请求数</p>
                  <p className="text-2xl font-bold text-white">{data.requests.total}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">错误数</p>
                  <p className="text-2xl font-bold text-red-400">{data.requests.errors}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">错误率</p>
                  <p className="text-lg font-bold text-white">{data.requests.errorRate}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">请求/小时</p>
                  <p className="text-lg font-bold text-white">{data.requests.requestsPerHour}</p>
                </div>
              </div>
              {data.requests.topPaths.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">热门路径</p>
                  <div className="space-y-1">
                    {data.requests.topPaths.slice(0, 5).map((p) => (
                      <div key={p.path} className="flex justify-between text-xs">
                        <span className="text-zinc-400 font-mono truncate">{p.path}</span>
                        <span className="text-white ml-2">{p.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Memory Usage */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">系统资源</h2>
              <div className="space-y-4">
                <ProgressBar
                  label="堆内存"
                  used={data.system.memory.heapUsed}
                  total={data.system.memory.heapTotal}
                  unit="MB"
                  color="blue"
                />
                <ProgressBar
                  label="RSS 内存"
                  used={data.system.memory.rss}
                  total={Math.max(data.system.memory.rss * 1.5, 512)}
                  unit="MB"
                  color="purple"
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-zinc-500">Node.js</span>
                  <p className="text-white font-mono">{data.system.nodeVersion}</p>
                </div>
                <div>
                  <span className="text-zinc-500">平台</span>
                  <p className="text-white font-mono">{data.system.platform}</p>
                </div>
              </div>

              {/* Database Records */}
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-3">数据库记录</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{data.database.records.users}</p>
                    <p className="text-[10px] text-zinc-500">用户</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{data.database.records.assets}</p>
                    <p className="text-[10px] text-zinc-500">资产</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{data.database.records.logs}</p>
                    <p className="text-[10px] text-zinc-500">日志</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Ranking */}
          {data.tenants.topTenants.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">租户活跃度排行</h2>
              <div className="table-responsive">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-xs font-medium text-zinc-500 pb-3">#</th>
                      <th className="text-left text-xs font-medium text-zinc-500 pb-3">租户</th>
                      <th className="text-left text-xs font-medium text-zinc-500 pb-3">套餐</th>
                      <th className="text-right text-xs font-medium text-zinc-500 pb-3">用户</th>
                      <th className="text-right text-xs font-medium text-zinc-500 pb-3">资产</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {data.tenants.topTenants.map((t, i) => (
                      <tr key={t.slug}>
                        <td className="py-2.5 text-xs text-zinc-500">{i + 1}</td>
                        <td className="py-2.5">
                          <p className="text-sm text-white">{t.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{t.slug}</p>
                        </td>
                        <td className="py-2.5 text-xs text-zinc-400">{t.plan}</td>
                        <td className="py-2.5 text-sm text-white text-right">{t.users}</td>
                        <td className="py-2.5 text-sm text-white text-right">{t.assets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    green: 'bg-green-500/10 border-green-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
    </div>
  );
}

function ProgressBar({ label, used, total, unit, color }: {
  label: string;
  used: number;
  total: number;
  unit: string;
  color: string;
}) {
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const colorClass = color === 'blue' ? 'bg-blue-500' : 'bg-purple-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white">{used}{unit} / {Math.round(total)}{unit} ({percent}%)</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
