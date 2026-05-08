export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-card p-5 border border-border shadow-card flex flex-col h-full min-h-[160px]">
      <div className="shimmer rounded-[4px] w-3/4 h-4 mb-4"></div>
      <div className="flex flex-col gap-2 mb-auto">
        <div className="shimmer rounded-[4px] w-full h-3"></div>
        <div className="shimmer rounded-[4px] w-2/3 h-3"></div>
      </div>
      <div className="shimmer rounded-[4px] w-1/4 h-3 mt-3"></div>
    </div>
  );
}

export function SkeletonTaskCard() {
  return (
    <div className="bg-surface rounded-card p-4 border border-border shadow-card">
      <div className="flex justify-between items-start mb-3">
        <div className="shimmer rounded-[4px] w-2/3 h-3.5"></div>
        <div className="shimmer rounded-badge w-12 h-5"></div>
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <div className="shimmer rounded-[4px] w-full h-2.5"></div>
        <div className="shimmer rounded-[4px] w-3/4 h-2.5"></div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="shimmer rounded-[4px] w-20 h-4"></div>
        <div className="shimmer rounded-[4px] w-16 h-4"></div>
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-surface rounded-card p-5 border border-border shadow-card">
      <div className="shimmer rounded-[4px] w-16 h-8"></div>
      <div className="shimmer rounded-[4px] w-20 h-3 mt-2"></div>
    </div>
  );
}
