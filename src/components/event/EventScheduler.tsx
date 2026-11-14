"use client";
import Link from "next/link";
import { registrationHref } from "@/lib/registrationLinks";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Event } from "@prisma/client";

const subscribeFormSchema = z.object({
  contact: z.string().refine((val) => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const isPhone = /^(?:\+62|08)[0-9]{8,13}$/.test(val);
    return isEmail || isPhone;
  }, {
    message: "Masukkan Email valid atau No. WhatsApp Indonesia berawalan 08 / +62",
  }),
});

type SubscribeValues = z.infer<typeof subscribeFormSchema>;

export function EventScheduler({ initialEvents, registrationBase, serverNow = 0 }: { initialEvents: Event[]; registrationBase?: string; serverNow?: number }) {
  const [selectedTab, setSelectedTab] = useState<"ALL" | "WEBINAR" | "TEMU_ONLINE" | "WORKSHOP" | "ACARA">("ALL");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ success: boolean; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscribeValues>({
    resolver: zodResolver(subscribeFormSchema),
  });

  const onSubmit = async (data: SubscribeValues) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseJson = await res.json();
      if (res.ok) {
        setMsg({ success: true, text: "Terima kasih, kontak Anda sudah tercatat." });
        reset();
      } else {
        setMsg({ success: false, text: responseJson.error || "Gagal mendaftar." });
      }
    } catch {
      setMsg({ success: false, text: "Koneksi terganggu. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = initialEvents.filter(
    (e) => selectedTab === "ALL" || e.category === selectedTab
  );

  return (
    <div className="space-y-12">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center border-b border-outline-variant pb-4">
        {[
          { id: "ALL" as const, label: "Semua Jadwal" },
          { id: "WEBINAR" as const, label: "Webinar Daring" },
          { id: "TEMU_ONLINE" as const, label: "Temu Virtual" },
          { id: "WORKSHOP" as const, label: "Workshop" },
          { id: "ACARA" as const, label: "Acara Komunitas" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-6 py-2 rounded-full font-label-sm transition-all border cursor-pointer ${
              selectedTab === tab.id
                ? "bg-primary border-primary text-white"
                : "bg-surface border-outline/30 text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map((evt) => {
          const isCompleted = evt.status === "COMPLETED";
          const categoryLabel =
            evt.category === "WEBINAR"
              ? "Webinar Daring"
              : evt.category === "TEMU_ONLINE"
              ? "Temu Virtual"
              : evt.category === "WORKSHOP"
              ? "Workshop Liturgi"
              : "Acara Komunitas";

          return (
            <div
              key={evt.id}
              className="p-6 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="font-label-sm text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                    {categoryLabel}
                  </span>
                  <span
                    className={`font-label-sm text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                      isCompleted
                        ? "bg-surface-container text-on-surface-variant"
                        : "bg-primary text-white"
                    }`}
                  >
                    {isCompleted ? "Selesai" : "Akan Datang"}
                  </span>
                </div>
                <h3 className="font-headline-md text-xl text-on-surface font-bold line-clamp-2">
                  {evt.title}
                </h3>
              </div>

              <div className="flex items-center justify-between text-xs text-on-surface-variant mt-4 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                  <span>{new Date(evt.date).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" })} · {evt.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                  <span className="truncate max-w-[160px]">{evt.location}</span>
                </div>
              </div>
              {evt.status === "UPCOMING" && evt.registrationSlug && evt.registrationDeadline && new Date(evt.registrationDeadline).getTime() > serverNow && (
                <Link className="inline-flex min-h-11 items-center self-start font-semibold text-primary underline"
                  href={registrationHref(evt.registrationSlug, registrationBase)}>Lihat pendaftaran</Link>
              )}
            </div>
          );
        })}

        {filteredEvents.length === 0 && <p className="text-on-surface-variant">Belum ada jadwal untuk kategori ini.</p>}
      </div>

      {/* Newsletter Subscription CTA Section */}
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-surface-container-low border border-outline-variant card-glow space-y-6">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-primary">notifications_active</span>
          <h3 className="font-headline-md text-on-surface">Tinggalkan Kontak</h3>
          <p className="font-body-md text-sm text-on-surface-variant">
            Tinggalkan email atau nomor WhatsApp jika ingin dihubungi tentang jadwal SMI.
          </p>
        </div>

        {msg && (
          <div
            className={`p-3 text-sm rounded-xl font-body-md text-center border ${
              msg.success
                ? "bg-green-100 border-green-200 text-green-800"
                : "bg-error-container border-error/20 text-error"
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow">
            <input
              type="text"
              {...register("contact")}
              disabled={loading}
              aria-label="Email atau nomor WhatsApp"
              placeholder="Email atau No. WA (0812...)"
              className="w-full px-4 py-3 rounded-xl border border-outline bg-surface text-on-surface font-body-md focus:outline-none focus:border-primary transition-colors text-sm"
            />
            {errors.contact && (
              <p className="text-xs text-error font-body-md mt-1 text-left">{errors.contact.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white font-label-lg px-6 py-3 rounded-full hover:bg-primary-container transition-all active:scale-95 text-sm shrink-0 h-[48px] cursor-pointer"
          >
            {loading ? "Menyimpan…" : "Simpan kontak"}
          </button>
        </form>
      </div>
    </div>
  );
}
