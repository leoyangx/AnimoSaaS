'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AssetCard } from '@/components/AssetCard';
import { CategoryFilter, TagFilter } from '@/components/TopFilter';
import { Asset } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

const ITEMS_PER_PAGE = 24;

export default function ClientHome({ 
  initialAssets, 
  isLoggedIn,
  alistError,
  dynamicCategories = []
}: { 
  initialAssets: Asset[], 
  isLoggedIn: boolean,
  alistError?: string | null,
  dynamicCategories?: any[]
}) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';

  useEffect(() => {
    if (alistError) {
      console.error('[AList Error]:', alistError);
    }
  }, [alistError]);

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Section logic
  const isAnimationTeaching = selectedCategory === 'AN动画教学';
  const isCommonSoftware = selectedCategory === '常用软件';
  const isAssetLibrary = !isAnimationTeaching && !isCommonSoftware;

  // Filter categories based on section
  const filteredCategories = useMemo(() => {
    if (isAnimationTeaching || isCommonSoftware) return [];
    // Asset Library excludes the special sections
    return dynamicCategories.filter(cat => cat.id !== 'AN动画教学' && cat.id !== '常用软件');
  }, [dynamicCategories, isAnimationTeaching, isCommonSoftware]);

  const handleSetCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedTag('all');
    setCurrentPage(1);
  };

  const handleSetTag = (tag: string) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  };

  const handleSetSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const filteredAssets = useMemo(() => {
    return initialAssets.filter((asset: Asset) => {
      // Isolation logic:
      // If we are in a specific section, we only show assets of that category.
      // If we are in "Asset Library" (all or specific asset cat), we exclude the special sections.
      let matchesSection = true;
      if (isAnimationTeaching) {
        matchesSection = asset.category === 'AN动画教学';
      } else if (isCommonSoftware) {
        matchesSection = asset.category === '常用软件';
      } else {
        // Asset Library: exclude special ones
        const isSpecial = asset.category === 'AN动画教学' || asset.category === '常用软件';
        if (isSpecial) return false;
        
        if (selectedCategory !== 'all') {
          matchesSection = asset.category === selectedCategory;
        }
      }

      const matchesTag = selectedTag === 'all' || asset.tags.includes(selectedTag);
      const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesSection && matchesTag && matchesSearch;
    });
  }, [initialAssets, selectedCategory, selectedTag, searchQuery, isAnimationTeaching, isCommonSoftware]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const categoryMap: Record<string, string> = {
    'character': '角色模型',
    'scene': '场景素材',
    'prop': '道具组件',
    'effect': '特效插件',
    'video': '视频素材',
    'alist': '网盘资源',
    'ui': 'UI组件',
    'other': '其他资源',
    'all': '全部素材',
    'AN动画教学': '动画教学',
    '常用软件': '常用软件'
  };

  const displayCategoryName = categoryMap[selectedCategory.toLowerCase()] || selectedCategory;

  // Aspect Ratio based on section
  const cardAspectRatio = (isAnimationTeaching || isCommonSoftware) ? 'aspect-[4/3]' : 'aspect-video';

  return (
    <div className="flex flex-col pt-4">
      {/* Main Content Area - Increased Scale */}
      <div className="max-w-[1920px] mx-auto w-full px-6 sm:px-10 lg:px-16 py-4 space-y-6">
        {/* Header Row: Title + Categories + Search */}
        <div className="flex flex-col gap-4 pb-4 border-b border-white/5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
              {/* Section Title */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="h-[1px] w-8 bg-brand-accent shadow-[0_0_10px_rgba(0,255,136,0.5)]" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-brand-accent/60">{displayCategoryName}</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <h2 className="text-4xl font-black tracking-tighter text-text-primary drop-shadow-2xl">
                    {isAnimationTeaching ? '教学视频' : isCommonSoftware ? '软件中心' : '素材合集'}
                  </h2>
                  <span className="text-text-secondary font-mono text-lg font-black">
                    [{filteredAssets.length.toString().padStart(3, '0')}]
                  </span>
                </div>
              </div>

              {/* Categories Integrated Next to Title (Only for Asset Library) */}
              {isAssetLibrary && (
                <div className="flex items-center gap-3 pt-2 md:pt-0">
                  <button
                    onClick={() => handleSetCategory('all')}
                    className={cn(
                      'px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border min-w-[100px]',
                      selectedCategory === 'all'
                        ? 'bg-brand-accent border-brand-accent text-black shadow-[0_0_20px_rgba(0,255,136,0.3)]'
                        : 'bg-white/[0.03] border-white/10 text-text-secondary hover:text-text-primary'
                    )}
                  >
                    全部档案
                  </button>
                  <CategoryFilter 
                    selectedCategory={selectedCategory}
                    setSelectedCategory={handleSetCategory}
                    setSelectedTag={setSelectedTag}
                    dynamicCategories={filteredCategories}
                  />
                </div>
              )}
            </div>

            {/* Search Bar - Positioned at the right of the same row */}
            <div className="relative w-full max-w-sm group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-accent transition-colors" size={18} />
              <input
                type="text"
                placeholder="搜索素材或关键词..."
                value={searchQuery}
                onChange={(e) => handleSetSearch(e.target.value)}
                className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-14 text-sm font-bold text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-accent/40 focus:bg-white/[0.05] transition-all shadow-2xl"
              />
            </div>
          </div>

          {/* Tags Row - Below Title */}
          {isAssetLibrary && selectedCategory !== 'all' && (
            <div className="pt-2">
              <TagFilter 
                selectedCategory={selectedCategory}
                selectedTag={selectedTag}
                setSelectedTag={handleSetTag}
                dynamicCategories={dynamicCategories}
              />
            </div>
          )}
        </div>

        {paginatedAssets.length > 0 ? (
          <div className="space-y-12">
            {/* Grid Layout - Larger Cards & Better Spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {paginatedAssets.map((asset: Asset, index: number) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ 
                    duration: 0.8, 
                    delay: (index % 5) * 0.1,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  <AssetCard 
                    asset={asset} 
                    isLoggedIn={isLoggedIn} 
                    aspectRatio={cardAspectRatio}
                  />
                </motion.div>
              ))}
            </div>

            {/* Pagination - Professional Style */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-6 py-12 border-t border-white/5">
                <div className="flex flex-wrap justify-center items-center gap-4">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/10 text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-white/40 disabled:opacity-10 transition-all bg-white/[0.01]"
                  >
                    <ChevronLeft size={16} />
                    上一页
                  </button>
                  
                  <div className="flex items-center gap-3">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      if (
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-12 h-12 rounded-xl text-sm font-black transition-all border",
                              currentPage === page
                                ? "bg-brand-accent border-brand-accent text-black shadow-[0_0_20px_rgba(0,255,136,0.4)]"
                                : "bg-white/[0.03] border-white/10 text-text-secondary hover:text-text-primary hover:border-white/30"
                            )}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="text-text-secondary font-black px-2 opacity-20">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/10 text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-white/40 disabled:opacity-10 transition-all bg-white/[0.01]"
                  >
                    下一页
                    <ChevronRight size={16} />
                  </button>
                </div>
                
                <div className="flex flex-wrap justify-center items-center gap-8 text-[11px] font-black uppercase tracking-[0.3em] text-text-secondary opacity-40">
                  <span className="flex items-center gap-2">
                    <span>PAGE</span>
                    <span className="text-brand-accent">{currentPage}</span>
                    <span>/</span>
                    <span>{totalPages}</span>
                  </span>
                  <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
                  <span className="flex items-center gap-2">
                    <span>TOTAL</span>
                    <span className="text-text-primary">{filteredAssets.length}</span>
                    <span>ITEMS</span>
                  </span>
                  <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-3">
                    <span>GO TO</span>
                    <input 
                      type="number" 
                      min={1} 
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= totalPages) {
                          setCurrentPage(val);
                        }
                      }}
                      className="w-14 h-8 bg-white/[0.05] border border-white/20 rounded-lg text-center text-text-primary font-black focus:outline-none focus:border-brand-accent/60 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[500px] rounded-[4rem] border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-8">
            <div className="w-32 h-32 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <Search size={48} className="text-text-secondary opacity-20" />
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-4xl font-black tracking-tighter text-text-secondary opacity-40">未找到结果</h3>
              <p className="text-text-secondary text-sm uppercase tracking-widest font-bold opacity-60">请尝试调整您的搜索或筛选条件</p>
            </div>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedTag('all');
              }}
              className="text-brand-accent text-[10px] font-bold uppercase tracking-[0.3em] hover:underline underline-offset-8"
            >
              重置档案筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
