export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-44 rounded-2xl bg-surface-container-high border border-outline-variant/40" />

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-surface-container-high border border-outline-variant/40"
          />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="h-64 rounded-2xl bg-surface-container-high border border-outline-variant/40" />
    </div>
  );
}
