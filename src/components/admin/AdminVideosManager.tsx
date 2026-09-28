"use client";

import { useState } from "react";
import Image from "next/image";

export type VideoCategory = "TUTORIAL" | "GALLERY" | "FUN_FACT";

export interface VideoData {
  id: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  videoUrl: string;
  thumbnail: string | null;
  duration: string;
  author: string;
  viewsCount: number;
  isFeatured: boolean;
  createdAt: string;
}

interface AdminVideosManagerProps {
  initialVideos: VideoData[];
}

export function AdminVideosManager({ initialVideos }: AdminVideosManagerProps) {
  const [videos, setVideos] = useState<VideoData[]>(initialVideos);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modal form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: VideoCategory;
    videoUrl: string;
    thumbnail: string;
    duration: string;
    author: string;
    isFeatured: boolean;
  }>({
    title: "",
    description: "",
    category: "TUTORIAL",
    videoUrl: "",
    thumbnail: "",
    duration: "10:00",
    author: "SMI Media",
    isFeatured: false,
  });

  const [deletingVideo, setDeletingVideo] = useState<VideoData | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter
  const filtered = videos.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      v.title.toLowerCase().includes(q) ||
      (v.description && v.description.toLowerCase().includes(q)) ||
      v.author.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (categoryFilter !== "ALL" && v.category !== categoryFilter) return false;
    return true;
  });

  const openCreateModal = () => {
    setEditingVideo(null);
    setFormData({
      title: "",
      description: "",
      category: "TUTORIAL",
      videoUrl: "",
      thumbnail: "",
      duration: "08:15",
      author: "SMI Media",
      isFeatured: false,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (video: VideoData) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      category: video.category,
      videoUrl: video.videoUrl,
      thumbnail: video.thumbnail || "",
      duration: video.duration,
      author: video.author,
      isFeatured: video.isFeatured,
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("save-video");
    setMessage(null);

    const isEdit = !!editingVideo;
    const url = isEdit ? `/api/admin/videos/${editingVideo.id}` : "/api/admin/videos";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        if (isEdit) {
          setVideos((prev) =>
            prev.map((vid) => (vid.id === editingVideo.id ? { ...vid, ...data.video } : vid))
          );
          setMessage({
            type: "success",
            text: `Video "${formData.title}" berhasil diperbarui.`,
          });
        } else {
          setVideos((prev) => [data.video, ...prev]);
          setMessage({
            type: "success",
            text: `Video baru "${formData.title}" berhasil ditambahkan ke galeri.`,
          });
        }
        setIsFormOpen(false);
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menyimpan video." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteVideo = async () => {
    if (!deletingVideo) return;

    setLoadingAction("delete-video");
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/videos/${deletingVideo.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        setVideos((prev) => prev.filter((vid) => vid.id !== deletingVideo.id));
        setMessage({
          type: "success",
          text: `Video "${deletingVideo.title}" berhasil dihapus.`,
        });
        setDeletingVideo(null);
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menghapus video." });
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
              smart_display
            </span>
            Galeri Video &amp; Materi SMI
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm mt-1">
            Kelola katalog video pembelajaran liturgi, dokumentasi perhimpunan, dan konten fun fact putra-putri altar.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-label-lg text-xs sm:text-sm font-semibold hover:bg-primary-container shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Tambah Video Baru</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-xl">
              search
            </span>
            <input
              type="text"
              placeholder="Cari judul video, topik, atau pembuat konten..."
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

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-xs font-semibold focus:border-primary focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="TUTORIAL">Video Tutorial</option>
              <option value="GALLERY">Galeri Kegiatan</option>
              <option value="FUN_FACT">Fun Fact Misdinar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">
            videocam_off
          </span>
          <p className="font-headline-md text-on-surface font-bold text-sm">
            Tidak ada video yang ditemukan
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Klik tombol &quot;Tambah Video Baru&quot; untuk menambahkan materi video.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl overflow-hidden shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full bg-surface-container overflow-hidden">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                      <span className="material-symbols-outlined text-4xl">movie</span>
                    </div>
                  )}

                  {/* Duration Badge */}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[11px] font-bold">
                    {item.duration}
                  </span>

                  {/* Featured Badge */}
                  {item.isFeatured && (
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-primary text-white font-label-sm text-[10px] font-bold shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">star</span>
                      <span>Unggulan</span>
                    </span>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span className="font-mono font-bold uppercase tracking-wider text-secondary">
                      {item.category.replace("_", " ")}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span>{item.viewsCount}x</span>
                    </span>
                  </div>

                  <h2 className="font-headline-md text-on-surface font-bold text-sm line-clamp-2 leading-snug">
                    {item.title}
                  </h2>

                  {item.description && (
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-1.5 text-xs text-on-surface-variant/70">
                    <span className="material-symbols-outlined text-sm">person</span>
                    <span className="truncate">{item.author}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 border-t border-outline-variant/30 flex items-center justify-between mt-3">
                <a
                  href={item.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-label-lg font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span>Tonton</span>
                </a>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                    title="Edit Video"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingVideo(item)}
                    className="p-1.5 rounded-lg text-error/70 hover:bg-error-container/40 hover:text-error transition-colors"
                    title="Hapus Video"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Create / Edit Video */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  {editingVideo ? "movie_edit" : "video_call"}
                </span>
                <h2 className="font-headline-md text-primary font-bold text-base sm:text-lg">
                  {editingVideo ? "Edit Video Galeri" : "Tambah Video Baru"}
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
                  Judul Video *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="misal: Panduan Peralatan Suci Ekaristi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                  Tautan YouTube Video *
                </label>
                <input
                  type="url"
                  required
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none font-mono"
                />
                <span className="text-[11px] text-on-surface-variant/70 mt-1 block">
                  Thumbnail akan otomatis diambil dari tautan YouTube jika URL thumbnail dikosongkan.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Kategori Video
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as VideoCategory })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-semibold focus:border-primary focus:outline-none"
                  >
                    <option value="TUTORIAL">TUTORIAL (Pembelajaran)</option>
                    <option value="GALLERY">GALLERY (Dokumentasi)</option>
                    <option value="FUN_FACT">FUN FACT (Trivia)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Durasi Video *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="misal: 10:15"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Pembuat Konten (Author)
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="SMI Media"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Tampilkan di Beranda?
                  </label>
                  <select
                    value={formData.isFeatured ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.value === "true" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-semibold focus:border-primary focus:outline-none"
                  >
                    <option value="false">Tidak (Biasa)</option>
                    <option value="true">Ya (Video Unggulan/Featured)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                  Deskripsi Video (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ringkasan isi video tutorial atau materi katekese..."
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
                  disabled={loadingAction === "save-video"}
                  className="px-6 py-2 rounded-full bg-primary text-white text-xs font-label-lg font-bold hover:bg-primary-container shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "save-video" ? "Menyimpan..." : "Simpan Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Video Confirmation */}
      {deletingVideo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-error/30 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-error/20 flex items-center justify-between bg-error-container/20">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h2 className="font-headline-md font-bold text-base">Hapus Video</h2>
              </div>
              <button
                type="button"
                onClick={() => setDeletingVideo(null)}
                className="text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Apakah Anda yakin ingin menghapus video{" "}
                <span className="font-bold text-on-surface">&quot;{deletingVideo.title}&quot;</span> dari
                galeri?
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setDeletingVideo(null)}
                  className="px-4 py-2 rounded-full border border-outline/30 text-xs font-label-lg text-on-surface-variant hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteVideo}
                  disabled={loadingAction === "delete-video"}
                  className="px-6 py-2 rounded-full bg-error text-white text-xs font-label-lg font-bold hover:bg-error/90 shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "delete-video" ? "Menghapus..." : "Ya, Hapus Video"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
