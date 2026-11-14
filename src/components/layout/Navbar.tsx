"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export function Navbar({ showQuiz, previewBetaNavbar }: { showQuiz: boolean; previewBetaNavbar: boolean }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const betaPage = previewBetaNavbar && (pathname === "/" || pathname === "/daftar/video-natal");
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Beranda", icon: "home" },
    { href: "/event", label: "Jadwal", icon: "calendar_month" },
    { href: "/merchandise", label: "Merchandise", icon: "storefront" },
    { href: "/video", label: "Video", icon: "play_circle" },
    ...(showQuiz || betaPage ? [{ href: "/quiz", label: "Kuis", icon: "quiz", protected: true }] : []),
    { href: "/coin", label: "Koin", icon: "token", protected: true },
    { href: "/membership", label: "Digital ID", icon: "badge", protected: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 border border-primary/20 bg-surface-container flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm inner-glow">
            <Image
              src="/logo_smi.png"
              alt="Logo Sahabat Misdinar Indonesia"
              fill
              sizes="36px"
              priority
              className="object-cover"
            />
          </div>
          <span className="font-headline-md text-primary tracking-tight font-black transition-colors group-hover:text-primary-container">
            SMI
          </span>
          {betaPage && <span className="text-xs font-semibold text-on-surface-variant">Beta</span>}
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            // Hide protected links if user is not logged in
            if (link.protected && !session && !betaPage) return null;
            if (betaPage) return (
              <span key={link.href} className="flex flex-col items-center px-2 py-2 text-on-surface-variant" aria-label={link.label + ", coming soon"}>
                <span className="text-sm">{link.label}</span><span className="text-xs">Coming soon</span>
              </span>
            );
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-label-sm transition-all ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-lg leading-none">
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Auth Action */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container transition-colors focus:outline-none"
                id="user-profile-menu-button"
              >
                {session.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Avatar"}
                    className="w-8 h-8 rounded-full border border-primary/20 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold">
                    {session.user?.name ? session.user.name[0].toUpperCase() : "U"}
                  </div>
                )}
                <span className="material-symbols-outlined text-sm hidden md:inline">
                  keyboard_arrow_down
                </span>
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-2xl card-glow border border-outline-variant py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-outline-variant">
                    <p className="font-body-md font-bold text-on-surface truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {session.user?.email}
                    </p>
                  </div>
                  {session.user?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-primary font-bold hover:bg-surface-container transition-colors border-b border-outline-variant/40"
                    >
                      <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                      <span>Portal Pengurus</span>
                    </Link>
                  )}
                  <Link
                    href="/membership"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">badge</span>
                    <span>Digital ID</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error-container/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-primary text-white font-label-lg px-6 py-2 rounded-full hover:bg-primary-container transition-all active:scale-95"
            >
              Masuk
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">
              {isOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer (visible on mobile only) */}
      {isOpen && (
        <div className="md:hidden bg-surface-container-lowest border-b border-outline-variant py-4 px-4 space-y-2 animate-in slide-in-from-top duration-200">
          {session && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant mb-2">
              {session.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "Avatar"}
                  className="w-10 h-10 rounded-full border border-primary/20 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold">
                  {session.user?.name ? session.user.name[0].toUpperCase() : "U"}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-body-md font-bold text-on-surface truncate text-sm">
                  {session.user?.name}
                </p>
                <p className="text-xs text-on-surface-variant truncate">
                  {session.user?.email}
                </p>
              </div>
            </div>
          )}

          {navLinks
            .filter((link) => betaPage || !link.protected || !!session)
            .map((link) => (
              betaPage ? <div key={link.href} className="flex items-center justify-between gap-3 px-4 py-3 text-on-surface-variant">
                <span>{link.label}</span><span className="text-xs">Coming soon</span>
              </div> :
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body-md ${
                  pathname === link.href
                    ? "bg-primary text-white font-bold"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-body-md bg-primary/10 text-primary font-bold border border-primary/20"
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span>Portal Pengurus SMI</span>
            </Link>
          )}

          {session && (
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-body-md text-error hover:bg-error-container/20 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Keluar</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
