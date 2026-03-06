import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Suspense } from 'react';
import { Package, Download, ChevronRight, Eye } from 'lucide-react';
import Link from 'next/link';
import { Asset, AssetCategory } from '@/lib/types';
import { StorageEngine } from '@/lib/storage';

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const config = await db.config.get();
  const navItems = await db.navigation.getAll();
  const session = await getSession();
  const { category } = await searchParams;

  const storage = new StorageEngine(config);

  // Pass navigation into settings format expected by Navbar
  const settings = {
    system: {
      siteName: config.title,
      logoUrl: config.logo,
      footerText: config.footer,
      primaryColor: config.themeColor,
    },
    navigation: navItems.filter((n) => n.status === 'active')
  };

  const categories = await db.categories.getAll();
  const allAssets = await db.assets.getAll();

  // Resolve category filter
  let activeCategoryId: string | null = null;
  if (category) {
    const matchedCategory = categories.find((c: AssetCategory) => c.name === category);
    if (matchedCategory) {
      activeCategoryId = matchedCategory.id;
    }
  }

  // Filter assets by category if selected
  const displayAssets = activeCategoryId
    ? allAssets.filter((a: Asset) => a.categoryId === activeCategoryId ||
      // Also include if it's in a subcategory
      categories.find((c: AssetCategory) => c.id === a.categoryId)?.parentId === activeCategoryId)
    : allAssets;

  // Resolve thumbnails for displayed assets
  const assetsWithThumbs = await Promise.all(displayAssets.map(async (asset: Asset) => {
    let thumb = asset.thumbnail;
    if (!thumb && asset.isDirectDownload) {
      thumb = await storage.resolveThumbnailUrl(asset.downloadUrl, asset.storageProvider || 'AList');
    }
    return { ...asset, resolvedThumb: thumb };
  }));

  return (
    <main className="min-h-screen pt-24 pb-32">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar user={session} settings={settings} />
      </Suspense>

      <div className="max-w-7xl mx-auto px-6">
        {!category && (
          <section className="py-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter text-white">
              {config.title || "专业动画素材"} <br />
              <span className="text-brand-primary">资源分发系统</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              {config.slogan || "基于 AnimoSaaS 的私域素材分发门户，支持 AList 映射与极速直链解析。"}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="#assets" className="px-8 py-4 bg-brand-primary text-black font-black rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,255,136,0.3)]">
                浏览素材库
              </Link>
              <Link href="/about" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all">
                了解更多
              </Link>
            </div>
          </section>
        )}

        {category && (
          <section className="py-12 border-b border-white/10 mb-12 animate-in fade-in slide-in-from-top-4">
            <h1 className="text-4xl font-display font-black text-white capitalize">{category}</h1>
            <p className="text-zinc-500 mt-2">共发现 {displayAssets.length} 组相关素材资源</p>
          </section>
        )}

        <div id="assets" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12">
          {assetsWithThumbs.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Package size={48} className="mx-auto text-zinc-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">暂无资源</h3>
              <p className="text-zinc-500">该分类下目前还没有可用的素材资源。</p>
            </div>
          ) : (
            assetsWithThumbs.map((asset: any) => (
              <div key={asset.id} className="glass-card group flex flex-col overflow-hidden hover:border-brand-primary/50 transition-colors">
                <div className="aspect-video relative overflow-hidden bg-zinc-900">
                  {asset.resolvedThumb ? (
                    <img
                      src={asset.resolvedThumb}
                      alt={asset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                      <Package size={32} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {asset.tags?.slice(0, 2).map((tag: string) => (
                      <span key={tag} className="text-[10px] px-2 py-1 bg-black/60 backdrop-blur-md rounded-full text-white font-bold tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col relative content-end">
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-brand-primary transition-colors">
                    {asset.title}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-4 flex-1">
                    {asset.description || '暂无描述信息'}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                      <div className="flex items-center gap-1">
                        <Download size={12} /> {asset.downloadCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={12} /> --
                      </div>
                    </div>

                    <Link
                      href={`/assets/${asset.id}`}
                      className="flex items-center gap-1 text-xs font-bold text-brand-primary group-hover:translate-x-1 transition-transform"
                    >
                      查看详情 <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 py-4 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl text-center z-[50]">
        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-2">
          {config.footer}
          {config.watermark && (
            <span className="opacity-50">| {config.watermark}</span>
          )}
        </p>
      </footer>
    </main>
  );
}
