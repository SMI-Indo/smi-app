"use client";

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

export function EventScheduler({ initialEvents }: { initialEvents: Event[] }) {
  const [selectedTab, setSelectedTab] = useState<"ALL" | "TUGAS" | "LATIHAN" | "ACARA">("ALL");
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
        setMsg({ success: true, text: "Terima kasih! Anda berhasil berlangganan jadwal." });
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
          { id: "TUGAS" as const, label: "Jadwal Tugas" },
          { id: "LATIHAN" as const, label: "Jadwal Latihan" },
          { id: "ACARA" as const, label: "Jadwal Acara" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-6 py-2 rounded-full font-label-sm transition-all border ${
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
          return (
            <div
              key={evt.id}
              className="p-6 rounded-2xl border border-outline-variant card-glow flex flex-col justify-between h-48 relative overflow-hidden transition-transform hover:scale-[1.01]"
              style={{ backgroundColor: "#fdb242", opacity: 0.95 }}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="font-label-sm text-xs px-3 py-1 rounded-full bg-neutral-900/10 text-neutral-900">
                    {evt.category}
                  </span>
                  <span
                    className={`font-label-sm text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full ${
                      isCompleted ? "bg-[#941a00] text-white" : "bg-[#c02400] text-white"
                    }`}
                  >
                    {isCompleted ? "Selesai" : "Akan Datang"}
                  </span>
                </div>
                <h3 className="font-headline-md text-xl text-neutral-900 font-bold line-clamp-2">
                  {evt.title}
                </h3>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-955 mt-4 font-mono">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>{evt.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span className="truncate max-w-[150px]">{evt.location}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dashed Placeholder Card */}
        <div className="p-6 rounded-2xl border-2 border-dashed border-outline flex flex-col items-center justify-center text-center h-48 bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer card-glow">
          <span className="material-symbols-outlined text-3xl text-primary animate-bounce">
            arrow_circle_down
          </span>
          <span className="font-label-lg text-primary text-xs mt-2">
            TAMPILKAN JADWAL LAINNYA
          </span>
        </div>
      </div>

      {/* Newsletter Subscription CTA Section */}
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-surface-container-low border border-outline-variant card-glow space-y-6">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-primary">notifications_active</span>
          <h3 className="font-headline-md text-on-surface">Dapatkan Jadwal Langsung</h3>
          <p className="font-body-md text-sm text-on-surface-variant">
            Berlangganan sekarang untuk menerima pembaharuan jadwal tugas atau latihan langsung ke Email / WhatsApp Anda.
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
            {loading ? "Mendaftar..." : "Berlangganan"}
          </button>
        </form>
      </div>
    </div>
  );
}
