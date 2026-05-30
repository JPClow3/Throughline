export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function ViewSkeleton() {
  return (
    <div className="skeleton-view" aria-busy="true" aria-label="Loading">
      <div className="skeleton-row">
        <Skeleton className="is-title" />
        <Skeleton className="is-pill" />
      </div>
      <Skeleton className="is-hero" />
      <div className="skeleton-grid">
        <Skeleton className="is-card" />
        <Skeleton className="is-card" />
        <Skeleton className="is-card" />
      </div>
    </div>
  );
}
