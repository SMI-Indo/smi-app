"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Countdown({ deadline, serverNow }: { deadline: string; serverNow: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const end = Date.parse(deadline);
    let referenceTime = Date.parse(serverNow);
    let started = performance.now();
    const abort = new AbortController();
    let refreshed = false;
    function update() {
      const seconds = Math.max(0, Math.ceil((end - referenceTime - (performance.now() - started)) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !refreshed) {
        refreshed = true;
        router.refresh();
      }
    }
    async function sync() {
      const sent = performance.now();
      try {
        const response = await fetch("/api/time", { signal: abort.signal, cache: "no-store" });
        if (!response.ok) return;
        const { now } = await response.json();
        if (abort.signal.aborted || !Number.isFinite(now)) return;
        started = (sent + performance.now()) / 2;
        referenceTime = now;
        update();
      } catch {
        // Keep the last server time when the connection is unavailable.
      }
    }
    update();
    void sync();
    document.addEventListener("visibilitychange", sync);
    const timer = window.setInterval(update, 1000);
    return () => {
      abort.abort();
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(timer);
    };
  }, [deadline, serverNow, router]);

  const days = remaining === null ? 0 : Math.floor(remaining / 86400);
  const hours = remaining === null ? 0 : Math.floor(remaining % 86400 / 3600);
  const minutes = remaining === null ? 0 : Math.floor(remaining % 3600 / 60);
  const seconds = remaining === null ? 0 : remaining % 60;
  return <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
    <p className="text-sm text-on-surface-variant">Pendaftaran ditutup dalam</p>
    <p className="mt-1 text-xl font-semibold tabular-nums" aria-live="off">
      {remaining === null ? "Menghitung…" : `${days} hari ${hours} jam ${minutes} menit ${seconds} detik`}
    </p>
  </div>;
}
