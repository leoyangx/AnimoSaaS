export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getTenantId } from '@/lib/tenant-context';
import { Navbar } from '@/components/Navbar';
import { Package, Download, Eye, Clock, Hash, AlertTriangle, FileText, Shield, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { StorageEngine } from '@/lib/storage';

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const asset = await db.assets.getById(id, tenantId);
  if (!asset) {
    notFound();
  }

  // 递增查看次数
  await db.assets.incrementView(id, tenantId);

  // Resolve Thumbnail via storage engine if applicable
  const storage = new StorageEngine(config);
  let resolvedThumb = asset.thumbnail;
  if (!resolvedThumb && asset.isDirectDownload) {
    resolvedThumb = await storage.resolveThumbnailUrl(
      asset.downloadUrl,
      asset.storageProvider || 'AList'
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-32">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar user={session} settings={settings} />
      </Suspense>

      <div className="max-w-5xl mx-auto px-6 mt-12 animate-in fade-in slide-in-from-bottom-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="aspect-video glass-card overflow-hidden relative flex items-center justify-center bg-black">
              {resolvedThumb ? (
                <Image
                  src={resolvedThumb}
                  alt={asset.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                  className="object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-zinc-600">
                  <Package size={64} />
                  <span className="text-sm font-bold tracking-widest uppercase">暂无预览图</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-black text-white leading-tight">
                  {asset.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-mono text-zinc-500">
                  {asset.showCreatedTime !== false && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-brand-primary" />
                      发布于 {formatDate(asset.createdAt)}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Download size={14} className="text-blue-400" />
                    {asset.downloadCount || 0} 次下载
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={14} className="text-purple-400" />
                    {(asset.viewCount || 0) + 1} 次浏览
                  </div>
                  {asset.copyrightType && asset.copyrightType !== 'none' && (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Shield size={14} />
                      {asset.copyrightLabel || (asset.copyrightType === 'original' ? '原创作品' : asset.copyrightType === 'commercial' ? '商用授权' : 'CC 协议')}
                    </div>
                  )}
                </div>
              </div>

              {asset.tags && asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-[10px] px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white font-bold tracking-wider"
                    >
                      <Hash size={10} className="text-brand-primary" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="glass-card p-6 md:p-8 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <FileText size={16} />
                  资源详情
                </h3>
                <div className="prose prose-invert prose-brand max-w-none text-zinc-300">
                  {asset.description ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{asset.description}</p>
                  ) : (
                    <p className="italic text-zinc-500">暂无详细描述</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="glass-card p-6 md:p-8 space-y-6 sticky top-32">
              <h3 className="text-xl font-display font-bold text-white">获取资源</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-sm text-zinc-500">下载权限</span>
                  <span className="text-sm font-bold text-brand-primary">
                    {asset.downloadPermission === 'all'
                      ? '所有人'
                      : asset.downloadPermission === 'member_only'
                        ? '注册学员'
                        : asset.permissionLevel || '指定等级'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-sm text-zinc-500">下载方式</span>
                  <span className="text-sm font-bold text-white">
                    {asset.downloadMethod === 'direct' ? '直接下载' : asset.downloadMethod === 'proxy' ? '代理下载' : '网盘下载'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-sm text-zinc-500">存储引擎</span>
                  <span className="text-sm font-bold text-white tracking-widest uppercase">
                    {asset.storageProvider || 'LOCAL'}
                  </span>
                </div>
                {asset.copyrightType && asset.copyrightType !== 'none' && (
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-sm text-zinc-500">版权信息</span>
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                      <Shield size={14} />
                      {asset.copyrightLabel || (asset.copyrightType === 'original' ? '原创' : asset.copyrightType === 'commercial' ? '商用' : 'CC')}
                    </span>
                  </div>
                )}
              </div>

              {/* 下载权限控制 */}
              {asset.downloadPermission === 'all' && !session ? (
                <a
                  href={`/api/download/${asset.id}`}
                  className="cyber-button w-full py-4 flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={18} />
                  立即下载资源
                </a>
              ) : !session ? (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3 text-orange-400">
                  <AlertTriangle size={20} className="flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold">需要登录</p>
                    <p className="text-xs opacity-80">您需要登录系统才能下载该资源。</p>
                    <Link
                      href="/login"
                      className="inline-block mt-2 text-xs font-bold underline underline-offset-4 hover:text-white transition-colors"
                    >
                      立即登录 →
                    </Link>
                  </div>
                </div>
              ) : (
                <a
                  href={`/api/download/${asset.id}`}
                  className="cyber-button w-full py-4 flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={18} />
                  立即下载资源
                </a>
              )}
            </div>
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
