import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getTenantId } from '@/lib/tenant-context';
import { Suspense } from 'react';

export default async function AboutPage() {
  const session = await getSession();
  const tenantId = await getTenantId();
  const config = await db.config.get(tenantId);
  const navItems = await db.navigation.getAll(tenantId);

  const settings = {
    system: {
      siteName: config.title,
      logoUrl: config.logo,
      footerText: config.footer,
      primaryColor: config.themeColor,
    },
    navigation: navItems.filter((n) => n.status === 'active'),
  };

  return (
    <main className="min-h-screen pt-24 pb-20 bg-bg-dark">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar user={session} settings={settings} />
      </Suspense>

      <div className="max-w-4xl mx-auto px-6 space-y-20">
        <section className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white">
            关于 {settings.system.siteName}
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
            致力于为创作者打造最纯粹、最高效的私域素材分发与教学平台。
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: '高效分发', desc: '通过深度集成网盘 API，我们实现了素材的“零成本”分发。' },
            {
              title: '私域安全',
              desc: '采用严格的邀请制注册逻辑，确保资源仅在您的私域流量池内流转。',
            },
            { title: '专业教学', desc: '不仅是素材库，更是学习中心。我们提供系统的动画教学资源。' },
            { title: '开源精神', desc: '项目完全开源，您可以根据自己的需求进行二次开发。' },
          ].map((item) => (
            <div key={item.title} className="glass-card p-8 space-y-4">
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>
      </div>

      <footer className="mt-20 py-10 border-t border-white/5 text-center">
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
          {settings.system.footerText}
        </p>
      </footer>
    </main>
  );
}
