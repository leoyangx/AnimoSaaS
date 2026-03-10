'use client';

export default function Loading() {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center space-y-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-brand-primary animate-pulse">
          Initializing System
        </span>
        <div className="h-0.5 w-32 bg-white/5 overflow-hidden rounded-full">
          <div className="h-full bg-brand-primary animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
