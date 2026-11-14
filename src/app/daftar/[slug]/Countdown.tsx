"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Countdown({ deadline, serverNow }: { deadline: string; serverNow: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initial = Math.max(0, Date.parse(deadline) - Date.parse(serverNow));
    const started = performance.now();
    let refreshed = false;
    function update() {
      const seconds = Math.max(0, Math.ceil((initial - (performance.now() - started)) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !refreshed) {
        refreshed = true;
        router.refresh();
      }
    }
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
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
