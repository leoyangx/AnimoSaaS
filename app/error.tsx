'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">出了点问题</h1>
        <p className="text-zinc-500 text-sm mb-2">
          应用程序遇到了意外错误，请尝试刷新页面。
        </p>
        {error.digest && (
          <p className="text-zinc-600 text-xs font-mono mb-8">
            错误ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold rounded-xl text-sm transition-colors"
          >
            <RefreshCw size={16} />
            重试
          </button>
          <a
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-colors border border-zinc-700"
          >
            <Home size={16} />
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
