'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  Shield, 
  HardDrive, 
  History, 
  Menu,
  ChevronRight,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuGroups = [
  {
    title: '业务管理',
    items: [
      { name: '仪表盘', href: '/admin', icon: LayoutDashboard },
      { name: '素材管理', href: '/admin/assets', icon: Package },
      { name: '用户管理', href: '/admin/users', icon: Users },
      { name: '导航管理', href: '/admin/navigation', icon: Menu },
    ]
  },
  {
    title: '系统配置',
    items: [
      { name: '品牌视觉', href: '/admin/settings/brand', icon: Palette },
      { name: '存储引擎', href: '/admin/settings/storage', icon: HardDrive },
      { name: '安全策略', href: '/admin/settings/security', icon: Shield },
      { name: '系统日志', href: '/admin/logs', icon: History },
    ]
  }
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#00ff88] flex items-center justify-center font-black text-black text-sm">
            A
          </div>
          <span className="font-display font-black text-xl tracking-tighter text-white">
            Animo<span className="text-[#00ff88]">SaaS</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-8">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group',
                      isActive 
                        ? 'bg-[#00ff88]/10 text-[#00ff88]' 
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={cn(isActive ? 'text-[#00ff88]' : 'text-zinc-500 group-hover:text-white')} />
                      {item.name}
                    </div>
                    {isActive && <ChevronRight size={14} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-[#00ff88]">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Administrator</p>
            <p className="text-[10px] text-zinc-500 truncate">admin@animo.saas</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
