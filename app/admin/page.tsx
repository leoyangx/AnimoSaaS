import { Package, Users, History, Menu } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { name: '素材总数', value: '1,284', icon: Package, color: 'text-[#00ff88]' },
    { name: '活跃用户', value: '456', icon: Users, color: 'text-blue-400' },
    { name: '导航项', value: '8', icon: Menu, color: 'text-purple-400' },
    { name: '今日日志', value: '124', icon: History, color: 'text-zinc-400' },
  ];

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-display font-black tracking-tighter text-white">管理中心</h1>
        <p className="text-zinc-500 text-sm mt-1">欢迎回来，管理员。以下是系统的实时运行状态。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.name} className="glass-card p-8 space-y-4 group">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{stat.name}</p>
              <p className="text-3xl font-display font-black text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">最近活动</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-[#00ff88]">
                  AD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">管理员 更新了 品牌视觉 设置</p>
                  <p className="text-[10px] text-zinc-500 truncate">2024-03-05 10:24:12</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">系统状态</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-500 uppercase tracking-widest">存储空间使用率</span>
                <span className="text-white">42%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#00ff88] w-[42%] rounded-full shadow-[0_0_10px_rgba(0,255,136,0.5)]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-500 uppercase tracking-widest">API 响应时间</span>
                <span className="text-white">24ms</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 w-[15%] rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
