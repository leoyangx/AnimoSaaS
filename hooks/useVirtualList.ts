'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
}

interface VirtualListResult<T> {
  virtualItems: { item: T; index: number; style: React.CSSProperties }[];
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 虚拟滚动 Hook
 * 仅渲染可视区域内的列表项，适用于大数据量列表
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  containerHeight,
}: UseVirtualListOptions<T>): VirtualListResult<T> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(containerHeight || 600);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setHeight(containerHeight || container.clientHeight);
    };

    updateHeight();

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [containerHeight]);

  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight) + overscan
  );

  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      item: items[i],
      index: i,
      style: {
        position: 'absolute' as const,
        top: i * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
      },
    });
  }

  return { virtualItems, totalHeight, containerRef };
}

/**
 * 无限滚动 Hook
 * 当用户滚动到底部时触发加载更多
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  threshold = 200,
}: {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loading, threshold]);

  return sentinelRef;
}

/**
 * 懒加载可见性 Hook
 * 只有元素进入视口时才渲染内容
 */
export function useLazyVisible(options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        ...options,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
