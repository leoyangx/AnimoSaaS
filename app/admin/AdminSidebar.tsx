'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Key,
  Settings,
  Home,
  LogOut,
  Activity,
  ChevronRight,
  Database,
  Globe,
  Palette,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const MENU_GROUPS = [
  {
    label: '系统概览',
    items: [
      { name: '控制面板', icon: LayoutDashboard, href: '/admin' },
      { name: '操作日志', icon: Activity, href: '/admin/logs' },
    ],
  },
  {
    label: '内容管理',
    items: [
      { name: '素材上传管理', icon: Package, href: '/admin/assets' },
      { name: '素材分类设置', icon: Database, href: '/admin/asset-categories' },
      { name: '顶部导航设置', icon: Globe, href: '/admin/navigation' },
    ],
  },
  {
    label: '用户管理',
    items: [
      { name: '用户列表', icon: Users, href: '/admin/users' },
      { name: '邀请码管理', icon: Key, href: '/admin/codes' },
    ],
  },
  {
    label: '开发者',
    items: [{ name: 'API 密钥', icon: Key, href: '/admin/api-keys' }],
  },
  {
    label: '系统配置',
    items: [
      { name: '品牌与视觉', icon: Palette, href: '/admin/settings' },
      { name: '存储引擎', icon: Database, href: '/admin/storage' },
      { name: '安全与验证', icon: Shield, href: '/admin/auth-settings' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 glass-panel border-r border-white/5 flex flex-col h-screen sticky top-0 z-50 shrink-0">
      <div className="p-8 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-emerald-400 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-brand-primary/20 group-hover:scale-110 transition-transform duration-500">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-lg tracking-tight text-gradient-white">
              AnimoSaaS
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              管理控制台
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-6 space-y-8 overflow-y-auto">
        {MENU_GROUPS.map((group) => (
          <div key={group.label} className="space-y-3">
            <h4 className="px-5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
              {group.label}
            </h4>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-4 px-5 py-3 rounded-2xl text-[13px] font-bold transition-all group relative',
                    pathname === item.href
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                      : 'text-zinc-500 hover:bg-white/[0.03] hover:text-white'
                  )}
                >
                  {pathname === item.href && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-brand-primary rounded-r-full"
                    />
                  )}
                  <item.icon
                    size={18}
                    className={cn(
                      'transition-transform group-hover:scale-110',
                      pathname === item.href ? 'text-brand-primary' : 'text-zinc-500'
                    )}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-bold text-zinc-500 hover:bg-white/[0.03] hover:text-white transition-all"
        >
          <Home size={18} />
          回到前台
        </Link>
        <button
          onClick={() => {
            document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.href = '/admin/login';
          }}
          className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-bold text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut size={18} />
          退出登录
        </button>
      </div>
    </aside>
  );
}
