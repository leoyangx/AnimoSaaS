export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-zinc-800 rounded-lg" />
          <div className="h-4 w-64 bg-zinc-800/60 rounded-lg mt-2" />
        </div>
        <div className="h-10 w-28 bg-zinc-800 rounded-xl" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-5">
            <div className="h-4 w-16 bg-zinc-800 rounded mb-3" />
            <div className="h-8 w-20 bg-zinc-800 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="glass-card p-6 space-y-4">
        <div className="h-5 w-32 bg-zinc-800 rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="h-10 w-10 bg-zinc-800 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-zinc-800/60 rounded" />
              <div className="h-3 w-1/2 bg-zinc-800/40 rounded" />
            </div>
            <div className="h-8 w-16 bg-zinc-800 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
