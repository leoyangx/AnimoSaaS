export const dynamic = 'force-dynamic';

import { Navbar } from '@/components/Navbar';
import { BannerAnnouncement } from '@/components/BannerAnnouncement';
import { CategorySidebar } from '@/components/CategoryTree';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getTenantId } from '@/lib/tenant-context';
import { Suspense } from 'react';
import { Package, Download, ChevronRight, Eye, Shield } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AssetCategory } from '@/lib/types';
import { StorageEngine } from '@/lib/storage';

const PAGE_SIZE = 20;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const tenantId = await getTenantId();
  const config = await db.config.get(tenantId);
  const navItems = await db.navigation.getAll(tenantId);
  const session = await getSession();
  const { category, page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || '1', 10) || 1);

  const storage = new StorageEngine(config);

  // Pass navigation into settings format expected by Navbar
  const settings = {
    system: {
      siteName: config.title,
      logoUrl: config.logo,
      footerText: config.footer,
      primaryColor: config.themeColor,
    },
    navigation: navItems.filter((n) => n.status === 'active'),
  };

  const categories = await db.categories.getActive(tenantId);

  // 获取层级分类结构（用于侧边栏）
  const hierarchicalCategories = await db.categories.getHierarchical(tenantId);

  // Resolve category filter
  let activeCategoryId: string | undefined;
  if (category) {
    const matchedCategory = categories.find((c: AssetCategory) => c.name === category);
    if (matchedCategory) {
      activeCategoryId = matchedCategory.id;
    }
  }

  // 分页查询（数据库级别限制，仅展示启用状态的素材）
  const { data: displayAssets, pagination } = await db.assets.getPaginated(tenantId, {
    page: currentPage,
    limit: PAGE_SIZE,
    categoryId: activeCategoryId,
    status: 'active',
  });

  // Resolve thumbnails for displayed assets
  const assetsWithThumbs = await Promise.all(
    displayAssets.map(async (asset: any) => {
      let thumb = asset.thumbnail;
      if (!thumb && asset.isDirectDownload) {
        thumb = await storage.resolveThumbnailUrl(
          asset.downloadUrl,
          asset.storageProvider || 'AList'
        );
      }
      return { ...asset, resolvedThumb: thumb };
    })
  );

  // 构建分页链接的查询参数
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (page > 1) params.set('page', page.toString());
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  return (
    <main className="min-h-screen pt-24 pb-32">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar user={session} settings={settings} />
      </Suspense>

      <BannerAnnouncement />

      <div className="max-w-7xl mx-auto px-6">
        {/* 分类标题 */}
        {category && (
          <section className="py-12 border-b border-white/10 mb-12 animate-in fade-in slide-in-from-top-4">
            <h1 className="text-4xl font-display font-black text-white capitalize">{category}</h1>
            <p className="text-zinc-500 mt-2">共发现 {pagination.total} 组相关素材资源</p>
          </section>
        )}

        {/* 主内容区域：侧边栏 + 素材网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 mt-12">
          {/* 左侧：分类侧边栏 */}
          <CategorySidebar
            categories={hierarchicalCategories}
            activeCategory={category}
            className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto"
          />

          {/* 右侧：素材网格 */}
          <div className="space-y-8">
            <div
              id="assets"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {assetsWithThumbs.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <Package size={48} className="mx-auto text-zinc-700 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">暂无资源</h3>
                  <p className="text-zinc-500">该分类下目前还没有可用的素材资源。</p>
                </div>
              ) : (
                assetsWithThumbs.map((asset: any) => (
              <div
                key={asset.id}
                className="glass-card group flex flex-col overflow-hidden hover:border-brand-primary/50 transition-colors"
              >
                <div className="aspect-video relative overflow-hidden bg-zinc-900">
                  {asset.resolvedThumb ? (
                    <Image
                      src={asset.resolvedThumb}
                      alt={asset.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                      <Package size={32} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {asset.copyrightType && asset.copyrightType !== 'none' && (
                      <span className="text-[10px] px-2 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full text-emerald-300 font-bold tracking-wider flex items-center gap-1">
                        <Shield size={8} />
                        {asset.copyrightLabel || (asset.copyrightType === 'original' ? '原创' : asset.copyrightType === 'commercial' ? '商用' : 'CC')}
                      </span>
                    )}
                    {asset.tags?.slice(0, 2).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-1 bg-black/60 backdrop-blur-md rounded-full text-white font-bold tracking-wider"
                      >
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
                        <Eye size={12} /> {asset.viewCount || 0}
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

        {/* 分页控件 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            {pagination.hasPrev && (
              <Link
                href={buildPageUrl(currentPage - 1)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/10 transition-colors"
              >
                上一页
              </Link>
            )}
            <span className="text-zinc-500 text-sm font-mono">
              {currentPage} / {pagination.totalPages}
            </span>
            {pagination.hasNext && (
              <Link
                href={buildPageUrl(currentPage + 1)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/10 transition-colors"
              >
                下一页
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  </div>

      <footer className="fixed bottom-0 left-0 right-0 py-4 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl text-center z-[50]">
        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-2">
          {config.footer}
          {config.watermark && <span className="opacity-50">| {config.watermark}</span>}
        </p>
      </footer>
    </main>
  );
}
