export default function AdminEventsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-14 rounded-2xl bg-surface-container-high border border-outline-variant/40" />
      <div className="h-20 rounded-2xl bg-surface-container-high border border-outline-variant/40" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-56 rounded-2xl bg-surface-container-high border border-outline-variant/40"
          />
        ))}
      </div>
    </div>
  );
}
