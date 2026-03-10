import { ShieldX } from 'lucide-react';
import Link from 'next/link';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldX size={32} className="text-yellow-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">租户已停用</h1>
        <p className="text-zinc-500 text-sm mb-8">
          当前租户已被管理员停用，暂时无法访问。如有疑问，请联系平台管理员。
        </p>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-8">
          <p className="text-xs text-zinc-500">可能的原因：</p>
          <ul className="text-xs text-zinc-400 mt-2 space-y-1 text-left">
            <li>- 订阅已过期</li>
            <li>- 违反了平台使用条款</li>
            <li>- 管理员主动停用了此租户</li>
          </ul>
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-colors border border-zinc-700"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
