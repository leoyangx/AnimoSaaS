export default function SuperAdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-zinc-800 rounded-lg" />
          <div className="h-4 w-72 bg-zinc-800/60 rounded-lg mt-2" />
        </div>
        <div className="h-10 w-32 bg-zinc-800 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-5">
            <div className="h-4 w-20 bg-zinc-800 rounded mb-3" />
            <div className="h-8 w-16 bg-zinc-800 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="h-5 w-36 bg-zinc-800 rounded-lg" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="h-10 w-10 bg-zinc-800 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-zinc-800/60 rounded" />
              <div className="h-3 w-1/3 bg-zinc-800/40 rounded" />
            </div>
            <div className="h-6 w-16 bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
