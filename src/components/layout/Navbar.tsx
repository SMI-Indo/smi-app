"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Beranda", icon: "home" },
    { href: "/event", label: "Jadwal", icon: "calendar_month" },
    { href: "/video", label: "Video", icon: "play_circle" },
    { href: "/coin", label: "Koin", icon: "token", protected: true },
    { href: "/membership", label: "Digital ID", icon: "badge", protected: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-primary/20 bg-surface-container flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm inner-glow">
            <Image
              src="/logo_smi.png"
              alt="Logo Sahabat Misdinar Indonesia"
              fill
              sizes="36px"
              priority
              className="object-cover"
            />
          </div>
          <span className="font-display-lg text-lg text-primary tracking-tight font-black transition-colors group-hover:text-primary-container">
            SMI
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            // Hide protected links if user is not logged in
            if (link.protected && !session) return null;
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
      {isOpen && !session && (
        <div className="md:hidden bg-surface-container-lowest border-b border-outline-variant py-4 px-4 space-y-2 animate-in slide-in-from-top duration-200">
          {navLinks
            .filter((link) => !link.protected)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body-md ${
                  pathname === link.href
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
        </div>
      )}
    </header>
  );
}
