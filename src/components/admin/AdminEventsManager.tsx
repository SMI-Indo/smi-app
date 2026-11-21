"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminRegistrationHref, suggestRegistrationSlug } from "@/app/admin/events/registration/paths";
import { wibDateInput } from "@/lib/registrationFields";

export type EventCategory = "WEBINAR" | "TEMU_ONLINE" | "WORKSHOP" | "ACARA";
export type EventStatus = "UPCOMING" | "COMPLETED";

export interface EventData {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  status: EventStatus;
  createdAt: string;
  registrationSlug: string | null;
}

interface AdminEventsManagerProps {
  initialEvents: EventData[];
}

export function AdminEventsManager({ initialEvents }: AdminEventsManagerProps) {
  const router = useRouter();
  const events = initialEvents;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [registrationSlug, setRegistrationSlug] = useState("");
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: EventCategory;
    date: string;
    time: string;
    location: string;
    status: EventStatus;
  }>({
    title: "",
    description: "",
    category: "TEMU_ONLINE",
    date: wibDateInput(new Date()),
    time: "19:00 - 21:00 WIB",
    location: "Zoom Meeting & Google Meet SMI",
    status: "UPCOMING",
  });

  const [deletingEvent, setDeletingEvent] = useState<EventData | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter
  const filtered = events.filter((e) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      e.title.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      e.location.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    return true;
  });

  const openCreateModal = () => {
    setEditingEvent(null);
    setRegistrationSlug("");
    setFormData({
      title: "",
      description: "",
      category: "TEMU_ONLINE",
      date: wibDateInput(new Date()),
      time: "19:00 - 21:00 WIB",
      location: "Zoom Cloud Meeting",
      status: "UPCOMING",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (event: EventData) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      category: event.category,
      date: wibDateInput(new Date(event.date)),
      time: event.time,
      location: event.location,
      status: event.status,
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("save-event");
    setMessage(null);

    const isEdit = !!editingEvent;
    const url = isEdit ? `/api/admin/events/${editingEvent.id}` : "/api/admin/events";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? formData : { ...formData, registrationSlug }),
      });

      const data = await res.json();
      if (res.ok) {
        if (isEdit) {
          router.refresh();
          setMessage({
            type: "success",
            text: `Jadwal "${formData.title}" berhasil diperbarui.`,
          });
        } else {
          router.refresh();
          setMessage({
            type: "success",
            text: `Jadwal kegiatan baru "${formData.title}" berhasil ditambahkan.`,
          });
        }
        setIsFormOpen(false);
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menyimpan jadwal kegiatan." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;

    setLoadingAction("delete-event");
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/events/${deletingEvent.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        router.refresh();
        setMessage({
          type: "success",
          text: `Jadwal "${deletingEvent.title}" berhasil dihapus.`,
        });
        setDeletingEvent(null);
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menghapus jadwal." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-primary text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
              calendar_month
            </span>
            Jadwal Kegiatan &amp; Event SMI
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm mt-1">
            Publikasikan dan perbarui jadwal webinar, temu virtual nusantara, workshop liturgi, dan kegiatan rutin.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-label-lg text-xs sm:text-sm font-semibold hover:bg-primary-container shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Tambah Jadwal Baru</span>
        </button>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-body-md flex items-center justify-between transition-all ${
            message.type === "success"
              ? "bg-secondary-container/20 text-on-surface border border-secondary-container"
              : "bg-error-container text-error border border-error/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {message.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-xl">
              search
            </span>
            <input
              type="text"
              placeholder="Cari judul kegiatan, materi, atau tautan lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>

          {/* Category & Status Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-xs font-semibold focus:border-primary focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="WEBINAR">Webinar Nasional</option>
              <option value="TEMU_ONLINE">Temu Virtual</option>
              <option value="WORKSHOP">Workshop Liturgi</option>
              <option value="ACARA">Acara / Misa</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-xs font-semibold focus:border-primary focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="UPCOMING">Akan Datang (Aktif)</option>
              <option value="COMPLETED">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">
            event_busy
          </span>
          <p className="font-headline-md text-on-surface font-bold text-sm">
            Tidak ada jadwal kegiatan yang ditemukan
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Klik tombol &quot;Tambah Jadwal Baru&quot; untuk mempublikasikan agenda komunitas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const isUpcoming = item.status === "UPCOMING";
            return (
              <div
                key={item.id}
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary-container/30 text-secondary border border-secondary-container/50">
                      {item.category.replace("_", " ")}
                    </span>

                    <span
                      className={`text-[10px] font-bold font-mono uppercase px-2.5 py-0.5 rounded-full ${
                        isUpcoming
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-surface-container text-on-surface-variant/70 border border-outline-variant/40"
                      }`}
                    >
                      {isUpcoming ? "Akan Datang" : "Selesai"}
                    </span>
                  </div>

                  <h2 className="font-headline-md text-on-surface font-bold text-base line-clamp-2 mb-1.5">
                    {item.title}
                  </h2>

                  {item.description && (
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-outline-variant/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-on-surface font-medium">
                    <span className="material-symbols-outlined text-base text-primary">
                      calendar_today
                    </span>
                    <span>
                      {new Date(item.date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-base text-secondary">
                      schedule
                    </span>
                    <span>{item.time}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-base text-primary/70">
                      location_on
                    </span>
                    <span className="truncate">{item.location}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3">
                    <Link href={adminRegistrationHref(item.id, item.registrationSlug)}
                      className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-primary underline">Kelola pendaftaran</Link>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="px-3.5 py-1.5 rounded-full border border-outline/30 text-xs font-label-lg font-semibold text-on-surface hover:bg-surface-container flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingEvent(item)}
                      className="px-3.5 py-1.5 rounded-full border border-error/30 text-xs font-label-lg font-semibold text-error hover:bg-error-container/40 flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create / Edit Event */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  {editingEvent ? "edit_calendar" : "add_circle"}
                </span>
                <h2 className="font-headline-md text-primary font-bold text-base sm:text-lg">
                  {editingEvent ? "Edit Jadwal Kegiatan" : "Tambah Jadwal Baru"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                  Judul Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="misal: Webinar Liturgi Putra-Putri Altar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                />
              </div>
              {!editingEvent && <div className="smi-form space-y-2">
                <label>Nama unik tautan pendaftaran (opsional)
                  <input value={registrationSlug} onChange={(event) => setRegistrationSlug(event.target.value)}
                    maxLength={80} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" aria-describedby="new-event-slug-help" />
                </label>
                <button type="button" disabled={!suggestRegistrationSlug(formData.title)}
                  className="min-h-11 text-primary underline disabled:opacity-50"
                  onClick={() => setRegistrationSlug(suggestRegistrationSlug(formData.title))}>Pakai judul kegiatan</button>
                <p id="new-event-slug-help" className="text-sm">Nama ini bisa diisi nanti. Pendaftaran dibuka setelah tenggat diatur.</p>
              </div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Kategori Kegiatan
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as EventCategory })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-semibold focus:border-primary focus:outline-none"
                  >
                    <option value="WEBINAR">WEBINAR</option>
                    <option value="TEMU_ONLINE">TEMU ONLINE</option>
                    <option value="WORKSHOP">WORKSHOP</option>
                    <option value="ACARA">ACARA</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Status Pelaksanaan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as EventStatus })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-semibold focus:border-primary focus:outline-none"
                  >
                    <option value="UPCOMING">UPCOMING (Akan Datang)</option>
                    <option value="COMPLETED">COMPLETED (Selesai)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Tanggal Kegiatan *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Waktu / Jam *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="misal: 19:00 - 21:00 WIB"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                  Lokasi / Tautan Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="misal: Zoom Meeting & YouTube Live SMI"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tuliskan gambaran singkat materi atau ketentuan kegiatan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-full border border-outline/30 text-xs font-label-lg text-on-surface-variant hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "save-event"}
                  className="px-6 py-2 rounded-full bg-primary text-white text-xs font-label-lg font-bold hover:bg-primary-container shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "save-event" ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Event Confirmation */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-error/30 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-error/20 flex items-center justify-between bg-error-container/20">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h2 className="font-headline-md font-bold text-base">Hapus Jadwal Kegiatan</h2>
              </div>
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                className="text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Apakah Anda yakin ingin menghapus jadwal kegiatan{" "}
                <span className="font-bold text-on-surface">&quot;{deletingEvent.title}&quot;</span>?
                Jadwal ini tidak akan lagi tampil di halaman publik situs.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setDeletingEvent(null)}
                  className="px-4 py-2 rounded-full border border-outline/30 text-xs font-label-lg text-on-surface-variant hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteEvent}
                  disabled={loadingAction === "delete-event"}
                  className="px-6 py-2 rounded-full bg-error text-white text-xs font-label-lg font-bold hover:bg-error/90 shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "delete-event" ? "Menghapus..." : "Ya, Hapus Jadwal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
