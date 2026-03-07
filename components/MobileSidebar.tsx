'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface MobileSidebarProps {
  children: React.ReactNode;
}

export function MobileSidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-[100] p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors shadow-lg"
      aria-label="打开菜单"
    >
      <Menu size={20} />
    </button>
  );
}

export function MobileSidebarWrapper({ children }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Mobile toggle button */}
      <MobileSidebarToggle onClick={() => setOpen(true)} />

      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:block">{children}</div>

      {/* Mobile sidebar - overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[150]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Sidebar panel */}
          <div className="absolute left-0 top-0 h-full w-72 animate-slide-in-left">
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg text-zinc-500 hover:text-white transition-colors"
              aria-label="关闭菜单"
            >
              <X size={18} />
            </button>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
