export default function CoinLoading() {
  return (
    <main className="min-h-screen p-6 space-y-6" style={{ backgroundColor: '#fdf9f3' }}>
      {/* Coin balance header skeleton */}
      <div className="h-10 rounded-xl w-1/2 mx-auto animate-pulse" style={{ backgroundColor: '#e6e2dc' }} />
      {/* Coin total badge skeleton */}
      <div className="h-24 w-48 rounded-[2rem] mx-auto animate-pulse" style={{ backgroundColor: '#e6e2dc' }} />
      {/* Bento grid skeleton */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-2xl animate-pulse"
            style={{ backgroundColor: '#f1ede7' }}
          />
        ))}
      </div>
    </main>
  );
}
