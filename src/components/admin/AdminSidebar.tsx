"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function AdminSidebar({ isOpen, onClose, adminUser }: AdminSidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      href: "/admin",
      label: "Ringkasan",
      icon: "dashboard",
      exact: true,
    },
    {
      href: "/admin/members",
      label: "Manajemen Anggota",
      icon: "group",
    },
    {
      href: "/admin/events",
      label: "Jadwal Kegiatan",
      icon: "calendar_month",
    },
    { href: "/admin/panduan", label: "Panduan Liturgis", icon: "menu_book" },
    { href: "/admin/events/registration", label: "Pendaftaran Acara", icon: "how_to_reg" },
    { href: "/admin/merchandise", label: "Merchandise", icon: "storefront" },
    {
      href: "/admin/videos",
      label: "Galeri Video",
      icon: "smart_display",
    },
    {
      href: "/admin/quiz",
      label: "Kuis Liturgi",
      icon: "quiz",
    },
    {
      href: "/admin/pelanggaran",
      label: "Poin Pelanggaran",
      icon: "warning",
    },
  ];

  const isActive = (link: (typeof navLinks)[0]) => {
    if (link.exact) {
      return pathname === link.href;
    }
    return pathname.startsWith(link.href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-surface-container-lowest border-r border-outline-variant flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Branding */}
        <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3" onClick={onClose}>
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-primary/20 bg-surface-container flex items-center justify-center shrink-0">
              <Image
                src="/logo_smi.png"
                alt="Logo SMI"
                fill
                sizes="36px"
                priority
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline-md text-primary font-bold text-base leading-tight">
                  SMI Pengurus
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                Portal Kontrol Utama
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container text-sm"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-label-lg font-bold text-on-surface-variant/60 uppercase tracking-wider">
            Menu Administrasi
          </div>

          {navLinks.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-label-lg text-sm transition-all ${
                  active
                    ? "bg-primary text-white shadow-sm font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-xl ${
                    active ? "text-white" : "text-primary/80"
                  }`}
                >
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[11px] font-label-lg font-bold text-on-surface-variant/60 uppercase tracking-wider">
            Pintasan Situs
          </div>

          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-label-lg text-sm text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-secondary">
              arrow_back
            </span>
            <span>Kembali ke Web Publik</span>
          </Link>
        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-outline-variant/60 bg-surface-container-low/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {(adminUser.name || adminUser.email || "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">
                  {adminUser.name || "Administrator"}
                </p>
                <p className="text-[11px] text-on-surface-variant/70 truncate">
                  {adminUser.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Keluar"
              className="p-1.5 rounded-lg text-error hover:bg-error-container/40 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
