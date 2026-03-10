'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('SuperAdmin error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertTriangle size={28} className="text-red-500" />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">平台管理出错</h2>
      <p className="text-zinc-500 text-sm mb-2 text-center max-w-md">
        超级管理后台遇到了意外错误，请尝试刷新页面。
      </p>
      {error.digest && (
        <p className="text-zinc-600 text-xs font-mono mb-6">错误ID: {error.digest}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold rounded-xl text-sm transition-colors"
        >
          <RefreshCw size={16} />
          重试
        </button>
        <Link
          href="/superadmin"
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-colors border border-zinc-700"
        >
          <Home size={16} />
          返回控制台
        </Link>
      </div>
    </div>
  );
}
