"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root Providers wrapper.
 * Wraps the app with:
 *   1. TanStack QueryClientProvider (server state caching)
 *   2. NextAuth SessionProvider (auth session)
 *
 * Zustand stores are accessed directly via hooks — no provider needed.
 */
export function Providers({ children }: ProvidersProps) {
  // Create a stable QueryClient instance per browser session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
