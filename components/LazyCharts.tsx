'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const ChartLoading = () => (
  <div className="h-[350px] w-full flex items-center justify-center">
    <LoadingSpinner size="md" text="加载图表..." />
  </div>
);

// Lazy load recharts components
export const LazyAreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), {
  ssr: false,
  loading: ChartLoading,
});

export const LazyArea = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });

export const LazyXAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });

export const LazyYAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });

export const LazyCartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);

export const LazyTooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), {
  ssr: false,
});

export const LazyResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
