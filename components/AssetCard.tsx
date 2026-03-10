'use client';

import { useState } from 'react';
import { Download, Lock, Cloud, X, ArrowRight, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Asset } from '@/lib/types';
import { cn } from '@/lib/utils';

export function AssetCard({
  asset,
  isLoggedIn,
  aspectRatio = 'aspect-video',
}: {
  asset: Asset;
  isLoggedIn: boolean;
  aspectRatio?: string;
}) {
  const [showDetail, setShowDetail] = useState(false);

  const thumbnail = `/api/assets/${asset.id}/thumbnail`;
  const isVideo = asset.category === 'video' || asset.thumbnail?.match(/\.(mp4|webm|ogg|mov)$/i);

  const categoryMap: Record<string, string> = {
    character: '角色模型',
    scene: '场景素材',
    prop: '道具组件',
    effect: '特效插件',
    video: '视频素材',
    alist: '网盘资源',
    ui: 'UI组件',
    other: '其他资源',
    AN动画教学: '动画教学',
    常用软件: '常用软件',
  };

  const displayCategory = asset.category
    ? categoryMap[asset.category.toLowerCase()] || asset.category
    : '未分类';

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) return;
    window.location.href = `/api/fetch/${asset.id}`;
  };

  return (
    <>
      <motion.div
        layout
        onClick={() => setShowDetail(true)}
        className={cn(
          'group relative rounded-3xl overflow-hidden cursor-pointer glass-card-premium',
          aspectRatio
        )}
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {isVideo ? (
            <video
              src={thumbnail}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              muted
              loop
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
          ) : (
            <Image
              src={thumbnail}
              alt={asset.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
        </div>

        {/* Copyright Tag */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-red-500/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[8px] font-bold text-white uppercase tracking-widest shadow-lg shadow-red-500/20">
            版权
          </div>
        </div>

        {/* Top Info */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/40">
              {displayCategory}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[8px] font-bold text-white/60 flex items-center gap-1">
            <Download size={8} />
            {asset.downloadCount}
          </div>
        </div>

        {/* Bottom Hover Content */}
        <div className="absolute inset-x-4 bottom-4 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {asset.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[7px] font-bold uppercase tracking-widest text-white/40 border border-white/10 px-1.5 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-black shadow-lg shadow-brand-accent/40">
              <Eye size={14} />
            </div>
          </div>
        </div>

        {/* Lock State */}
        {!isLoggedIn && (
          <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Lock size={32} className="text-white/20" />
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetail(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-6xl h-full max-h-[900px] glass-panel rounded-[3rem] overflow-hidden flex flex-col lg:flex-row"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowDetail(false)}
                className="absolute top-8 right-8 z-50 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              {/* Visual Side */}
              <div className="flex-1 bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 blur-3xl">
                  <Image
                    src={thumbnail}
                    alt={asset.title}
                    fill
                    sizes="50vw"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="relative z-10 w-full h-full p-12">
                  {isVideo ? (
                    <video
                      src={thumbnail}
                      className="w-full h-full object-contain rounded-2xl shadow-2xl"
                      controls
                      autoPlay
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <Image
                        src={thumbnail}
                        alt={asset.title}
                        fill
                        sizes="50vw"
                        className="object-contain rounded-2xl shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Info Side */}
              <div className="w-full lg:w-[450px] p-12 lg:p-16 flex flex-col justify-between bg-black/40">
                <div className="space-y-12">
                  <div className="space-y-4">
                    <span className="text-meta">{displayCategory}</span>
                    <h2 className="text-5xl font-black tracking-tighter leading-[0.9] text-white">
                      {asset.title}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <span className="text-meta">素材描述</span>
                    <p className="text-white/40 text-sm leading-relaxed">
                      {asset.description || '该档案条目暂无详细描述。'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <span className="text-meta">标签</span>
                    <div className="flex flex-wrap gap-2">
                      {asset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-4 py-2 rounded-full border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-white/20">
                    <Cloud size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      AList 分布式存储
                    </span>
                  </div>

                  {isLoggedIn ? (
                    <button
                      onClick={handleDownload}
                      className="cyber-button-v2 w-full justify-center"
                    >
                      <Download size={18} />
                      下载素材档案
                    </button>
                  ) : (
                    <div className="w-full py-5 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center gap-3 text-white/20 text-[10px] font-bold uppercase tracking-widest">
                      <Lock size={16} />
                      需要身份验证
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
