/**
 * 分类树组件
 *
 * 用于在前端显示层级分类结构，支持递归渲染子分类
 *
 * @author AnimoSaaS Team
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetCategory } from '@/lib/types';

interface CategoryTreeProps {
  categories: AssetCategory[];
  activeId?: string;
  level?: number;
  className?: string;
}

export function CategoryTree({
  categories,
  activeId,
  level = 0,
  className
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <ul className={cn('space-y-1', className)}>
      {categories.map((category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.has(category.id);
        const isActive = activeId === category.id;

        return (
          <li key={category.id}>
            <div className="flex items-center gap-1">
              {/* 展开/收起按钮 */}
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 hover:bg-white/5 rounded transition-colors"
                  aria-label={isExpanded ? '收起' : '展开'}
                >
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-zinc-500" />
                  ) : (
                    <ChevronRight size={14} className="text-zinc-500" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}

              {/* 分类链接 */}
              <Link
                href={`/?category=${category.name}`}
                className={cn(
                  'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                  'hover:bg-white/5',
                  isActive
                    ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20'
                    : 'text-zinc-400 hover:text-white'
                )}
                style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
              >
                {isExpanded || isActive ? (
                  <FolderOpen size={16} className={isActive ? 'text-brand-primary' : 'text-amber-400'} />
                ) : (
                  <Folder size={16} className="text-zinc-600" />
                )}
                <span className="flex-1">{category.name}</span>
              </Link>
            </div>

            {/* 递归渲染子分类 */}
            {hasChildren && isExpanded && (
              <CategoryTree
                categories={category.children!}
                activeId={activeId}
                level={level + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 分类侧边栏组件
 *
 * 包含标题和分类树
 */
interface CategorySidebarProps {
  categories: AssetCategory[];
  activeCategory?: string;
  className?: string;
}

export function CategorySidebar({
  categories,
  activeCategory,
  className
}: CategorySidebarProps) {
  // 查找激活的分类ID
  const findCategoryId = (cats: AssetCategory[], name: string): string | undefined => {
    for (const cat of cats) {
      if (cat.name === name) return cat.id;
      if (cat.children) {
        const found = findCategoryId(cat.children, name);
        if (found) return found;
      }
    }
    return undefined;
  };

  const activeCategoryId = activeCategory ? findCategoryId(categories, activeCategory) : undefined;

  return (
    <aside className={cn('glass-card p-6', className)}>
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
        <Folder size={20} className="text-brand-primary" />
        <h2 className="text-lg font-display font-bold text-white">素材分类</h2>
      </div>

      {/* 全部分类链接 */}
      <Link
        href="/"
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-2 transition-all',
          'hover:bg-white/5',
          !activeCategory
            ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20'
            : 'text-zinc-400 hover:text-white'
        )}
      >
        <FolderOpen size={16} className={!activeCategory ? 'text-brand-primary' : 'text-zinc-600'} />
        <span>全部分类</span>
      </Link>

      {/* 分类树 */}
      <CategoryTree
        categories={categories}
        activeId={activeCategoryId}
      />
    </aside>
  );
}
