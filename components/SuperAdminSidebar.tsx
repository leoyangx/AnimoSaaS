'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  Building2,
  LayoutDashboard,
  LogOut,
  Settings,
  Activity,
  AlertTriangle,
  Users,
} from 'lucide-react';

const navItems = [
  { label: '仪表板', href: '/superadmin', icon: LayoutDashboard },
  { label: '租户管理', href: '/superadmin/tenants', icon: Building2 },
  { label: '用户管理', href: '/superadmin/users', icon: Users },
  { label: '系统监控', href: '/superadmin/monitoring', icon: Activity },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/superadmin/logout', { method: 'POST' });
    router.push('/superadmin/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-zinc-900/50 border-r border-zinc-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">超级管理员</h1>
            <p className="text-[10px] text-zinc-500 font-mono">PLATFORM ADMIN</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/superadmin'
              ? pathname === '/superadmin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors w-full"
        >
          <LogOut size={18} />
          退出登录
        </button>
      </div>
    </aside>
  );
}
