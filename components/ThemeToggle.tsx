'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-14 h-7 rounded-full bg-white/5 border border-white/10 animate-pulse" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-14 h-7 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 group"
      aria-label="切换主题"
    >
      <motion.div
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-brand-primary to-emerald-400 flex items-center justify-center shadow-lg"
        animate={{
          x: isDark ? 0 : 28,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        {isDark ? (
          <Moon size={14} className="text-black" />
        ) : (
          <Sun size={14} className="text-black" />
        )}
      </motion.div>
    </button>
  );
}
