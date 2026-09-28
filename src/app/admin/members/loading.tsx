export default function AdminMembersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-14 rounded-2xl bg-surface-container-high border border-outline-variant/40" />

      {/* Filter skeleton */}
      <div className="h-20 rounded-2xl bg-surface-container-high border border-outline-variant/40" />

      {/* Table skeleton */}
      <div className="h-96 rounded-2xl bg-surface-container-high border border-outline-variant/40" />
    </div>
  );
}
