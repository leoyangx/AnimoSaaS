import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Glitch-style 404 */}
        <div className="relative mb-8">
          <h1 className="text-[120px] sm:text-[160px] font-display font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-zinc-700 to-zinc-900 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[120px] sm:text-[160px] font-display font-black leading-none text-brand-primary/20">
              404
            </span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-3">页面未找到</h2>
        <p className="text-zinc-500 text-sm mb-8">
          您访问的页面不存在或已被移除。请检查 URL 是否正确。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold rounded-xl text-sm transition-colors"
          >
            返回首页
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-colors border border-zinc-700"
          >
            管理后台
          </Link>
        </div>
      </div>
    </div>
  );
}
