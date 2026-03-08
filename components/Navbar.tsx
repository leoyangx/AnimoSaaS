'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  User,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Package,
  Play,
  Cpu,
  Info,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

// Icon mapping for navigation items
const IconMap: Record<string, any> = {
  Package,
  Play,
  Cpu,
  Info,
  ExternalLink,
};

// Module mapping for internal routes
const ModuleRoutes: Record<string, string> = {
  HOME: '/',
  ASSETS: '/?category=素材库',
  TUTORIALS: '/?category=动画教学',
  SOFTWARE: '/?category=常用软件',
  ABOUT: '/about',
};

export function Navbar({ user, settings }: { user: any; settings: any }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const resolveHref = (item: any) => {
    if (item.targetType === 'INTERNAL') {
      return ModuleRoutes[item.targetValue] || '/';
    }
    if (item.targetType === 'CATEGORY') {
      return `/?category=${item.targetValue}`;
    }
    return item.targetValue || '#'; // EXTERNAL
  };

  const isLinkActive = (item: any) => {
    const href = resolveHref(item);
    if (item.targetType === 'INTERNAL') {
      if (item.targetValue === 'HOME') return pathname === '/' && !currentCategory;
      if (item.targetValue === 'ASSETS') return currentCategory === '素材库';
      if (item.targetValue === 'TUTORIALS') return currentCategory === '动画教学';
      if (item.targetValue === 'SOFTWARE') return currentCategory === '常用软件';
      if (item.targetValue === 'ABOUT') return pathname === '/about';
    }
    if (item.targetType === 'CATEGORY') {
      return currentCategory === item.targetValue;
    }
    return false;
  };

  const navItems = settings?.navigation || [];
  const brandName = settings?.system?.siteName || 'AnimoSaaS';

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-6 pointer-events-none">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          'pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center gap-6 px-6 py-2.5 rounded-full border',
          isScrolled
            ? 'glass-panel border-white/10 scale-95 shadow-2xl'
            : 'bg-transparent border-transparent'
        )}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-black text-sm group-hover:rotate-12 transition-transform duration-500 shadow-xl">
            {brandName.charAt(0)}
          </div>
          <span className="font-display font-black text-xl tracking-tighter text-white group-hover:opacity-60 transition-opacity">
            {brandName}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item: any) => {
            const Icon = IconMap[item.icon || 'Package'] || Package;
            const active = isLinkActive(item);
            return (
              <Link
                key={item.id}
                href={resolveHref(item)}
                target={item.targetType === 'EXTERNAL' ? '_blank' : undefined}
                className={cn(
                  'text-sm font-black uppercase tracking-[0.2em] transition-all relative py-1 flex items-center gap-2',
                  active ? 'text-brand-primary' : 'text-zinc-400 hover:text-white'
                )}
              >
                <Icon size={14} />
                {item.name}
                {active && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-primary rounded-full shadow-[0_0_15px_var(--brand-primary-glow,rgba(0,255,136,0.8))]"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="h-4 w-[1px] bg-white/10 hidden md:block" />

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-6">

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <User size={12} className="text-zinc-400" />
                </div>
                <span className="text-sm font-black text-zinc-400 uppercase tracking-widest">
                  {user.email.split('@')[0]}
                </span>
              </div>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                className="text-zinc-400 hover:text-red-400 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              登录账号
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-12 p-12 md:hidden pointer-events-auto"
          >
            <div className="flex flex-col items-center gap-8">
              {navItems.map((item: any) => (
                <Link
                  key={item.id}
                  href={resolveHref(item)}
                  target={item.targetType === 'EXTERNAL' ? '_blank' : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'text-4xl font-black uppercase tracking-tighter',
                    isLinkActive(item) ? 'text-brand-primary' : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
