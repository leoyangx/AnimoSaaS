import { Navbar } from '@/components/Navbar';
import { getSettings } from '@/lib/settings-service';

import { Suspense } from 'react';

export default async function Home() {
  const settings = await getSettings();
  const session = null; // Simulate no user logged in

  return (
    <main className="min-h-screen pt-24 pb-32">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar user={session} settings={settings} />
      </Suspense>
      
      <div className="max-w-7xl mx-auto px-6">
        <section className="py-20 text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-white">
            专业动画素材<br />
            <span className="text-[#00ff88]">管理与分发系统</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
            基于 {settings.system.siteName} 的私域素材分发门户，支持 AList 映射与极速直链解析。
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-8 py-4 bg-[#00ff88] text-black font-black rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,255,136,0.3)]">
              浏览素材库
            </button>
            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all">
              了解更多
            </button>
          </div>
        </section>

        {/* Assets Grid Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card aspect-video p-8 flex flex-col justify-end group cursor-pointer overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
              <div className="relative z-20 space-y-2">
                <div className="w-10 h-10 rounded-lg bg-[#00ff88]/20 flex items-center justify-center text-[#00ff88]">
                  <Package size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">示例素材包 #{i}</h3>
                <p className="text-zinc-400 text-sm">包含 50+ 专业动画组件与源文件</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 py-4 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl text-center z-[90]">
        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.3em]">
          {settings.system.footerText}
        </p>
      </footer>
    </main>
  );
}

import { Package } from 'lucide-react';
