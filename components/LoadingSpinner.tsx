'use client';

export function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeMap[size]} border-zinc-700 border-t-brand-primary rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-zinc-500">{text}</p>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );
}

export function InlineLoading() {
  return (
    <div className="flex items-center justify-center py-10">
      <LoadingSpinner size="md" />
    </div>
  );
}
