export default function VideoLoading() {
  return (
    <main className="min-h-screen p-6 space-y-6" style={{ backgroundColor: '#fdf9f3' }}>
      {/* Category tabs skeleton */}
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-36 rounded-full animate-pulse"
            style={{ backgroundColor: '#ebe8e2' }}
          />
        ))}
      </div>
      {/* Featured video (bento) skeleton */}
      <div className="aspect-video rounded-[2rem] animate-pulse" style={{ backgroundColor: '#e6e2dc' }} />
      {/* Gallery grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-video rounded-2xl animate-pulse"
            style={{ backgroundColor: '#f1ede7' }}
          />
        ))}
      </div>
    </main>
  );
}
