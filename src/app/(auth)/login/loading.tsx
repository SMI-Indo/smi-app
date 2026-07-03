export default function LoginLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f3' }}>
      <div className="w-full max-w-md p-8 rounded-2xl space-y-4" style={{ backgroundColor: '#f7f3ed' }}>
        {/* Logo skeleton */}
        <div className="w-20 h-20 rounded-full mx-auto animate-pulse" style={{ backgroundColor: '#e6e2dc' }} />
        {/* Title skeleton */}
        <div className="h-8 rounded-xl w-3/4 mx-auto animate-pulse" style={{ backgroundColor: '#e6e2dc' }} />
        {/* Input skeletons */}
        <div className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: '#e6e2dc' }} />
        <div className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: '#e6e2dc' }} />
        {/* Button skeleton */}
        <div className="h-12 rounded-full animate-pulse" style={{ backgroundColor: '#941a00', opacity: 0.2 }} />
        {/* Social buttons */}
        <div className="flex gap-3">
          <div className="flex-1 h-10 rounded-full animate-pulse" style={{ backgroundColor: '#e6e2dc' }} />
          <div className="flex-1 h-10 rounded-full animate-pulse" style={{ backgroundColor: '#e6e2dc' }} />
        </div>
      </div>
    </main>
  );
}
