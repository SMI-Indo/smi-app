export default function AdminVideosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-14 rounded-2xl bg-surface-container-high border border-outline-variant/40" />
      <div className="h-20 rounded-2xl bg-surface-container-high border border-outline-variant/40" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-2xl bg-surface-container-high border border-outline-variant/40"
          />
        ))}
      </div>
    </div>
  );
}
