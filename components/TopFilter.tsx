'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function CategoryFilter({
  selectedCategory,
  setSelectedCategory,
  setSelectedTag,
  dynamicCategories = [],
}: any) {
  const categoryMap: Record<string, string> = {
    character: '角色模型',
    scene: '场景素材',
    prop: '道具组件',
    effect: '特效插件',
    video: '视频素材',
    alist: '网盘资源',
    ui: 'UI组件',
    other: '其他资源',
    all: '全部素材',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {dynamicCategories.map((cat: any) => (
        <button
          key={cat.id}
          onClick={() => {
            setSelectedCategory(cat.id);
            setSelectedTag('all');
          }}
          className={cn(
            'px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border',
            selectedCategory === cat.id
              ? 'bg-brand-accent border-brand-accent text-black shadow-[0_0_20px_rgba(0,255,136,0.3)]'
              : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/30 hover:text-white'
          )}
        >
          {categoryMap[cat.id.toLowerCase()] || cat.name}
        </button>
      ))}
    </div>
  );
}

export function TagFilter({
  selectedCategory,
  selectedTag,
  setSelectedTag,
  dynamicCategories = [],
}: any) {
  const categoryMap: Record<string, string> = {
    character: '角色模型',
    scene: '场景素材',
    prop: '道具组件',
    effect: '特效插件',
    video: '视频素材',
    alist: '网盘资源',
    ui: 'UI组件',
    other: '其他资源',
    all: '全部素材',
  };

  const currentCategoryData = dynamicCategories.find((c: any) => c.id === selectedCategory);

  if (!currentCategoryData || selectedCategory === 'all') return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedCategory}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-wrap items-center gap-2"
      >
        <button
          onClick={() => setSelectedTag('all')}
          className={cn(
            'px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border',
            selectedTag === 'all'
              ? 'bg-white/10 text-white border-white/20 shadow-lg'
              : 'bg-transparent border-white/5 text-white/20 hover:text-white hover:border-white/20'
          )}
        >
          全部标签
        </button>
        {currentCategoryData.tags?.map((tag: string) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={cn(
              'px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border',
              selectedTag === tag
                ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/40 shadow-[0_0_15px_rgba(0,255,136,0.2)]'
                : 'bg-transparent border-white/5 text-white/20 hover:text-white hover:border-white/20'
            )}
          >
            {tag}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

export function TopFilter({
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
  searchQuery,
  setSearchQuery,
  dynamicCategories = [],
}: any) {
  // This component is now a wrapper or can be removed if ClientHome uses sub-components directly
  return (
    <div className="w-full space-y-4">
      <CategoryFilter
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        setSelectedTag={setSelectedTag}
        dynamicCategories={dynamicCategories}
      />
      <TagFilter
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        dynamicCategories={dynamicCategories}
      />
    </div>
  );
}
