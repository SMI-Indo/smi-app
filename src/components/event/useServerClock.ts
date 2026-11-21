"use client";

import { useEffect, useState } from "react";

export function useServerClock(serverNow: number, enabled = true) {
  const [clock, setClock] = useState({ reference: serverNow, now: serverNow });

  useEffect(() => {
    if (!enabled) return;
    let reference = serverNow;
    let received = performance.now();
    let syncVersion = 0;
    const abort = new AbortController();
    const tick = () => setClock({ reference: serverNow, now: reference + performance.now() - received });

    async function sync() {
      const version = ++syncVersion;
      const sent = performance.now();
      try {
        const response = await fetch("/api/time", { signal: abort.signal, cache: "no-store" });
        if (!response.ok) return;
        const { now } = await response.json();
        if (abort.signal.aborted || version !== syncVersion || !Number.isFinite(now)) return;
        reference = now;
        received = (sent + performance.now()) / 2;
        tick();
      } catch {
        // The initial server timestamp remains usable while offline.
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") return;
      tick();
      void sync();
    }

    void sync();
    const timer = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      abort.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [serverNow, enabled]);

  return clock.reference === serverNow ? clock.now : serverNow;
}
