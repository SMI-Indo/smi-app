export default function MembershipLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#fdf9f3' }}>
      <div className="w-full max-w-sm space-y-4">
        {/* ID Card skeleton */}
        <div
          className="h-52 rounded-[2rem] animate-pulse"
          style={{ backgroundColor: '#fdb242', opacity: 0.3 }}
        />
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl animate-pulse"
              style={{ backgroundColor: '#f1ede7' }}
            />
          ))}
        </div>
        {/* Action buttons skeleton */}
        <div className="flex gap-3 justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-28 rounded-full animate-pulse"
              style={{ backgroundColor: '#e6e2dc' }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
