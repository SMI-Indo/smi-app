"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  adminUser: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function AdminLayoutClient({ children, adminUser }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminUser={adminUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/60 h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger Button (Mobile) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka Menu Sidebar"
              className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Portal Admin
              </span>
              <span className="hidden sm:inline-block text-xs text-on-surface-variant/70">
                Sahabat Misdinar Indonesia
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-on-surface block leading-tight">
                {adminUser.name || "Administrator"}
              </span>
              <span className="text-[10px] font-mono text-secondary uppercase font-semibold">
                {adminUser.role || "ADMIN"}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {(adminUser.name || adminUser.email || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
