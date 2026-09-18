import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Admin Dedicated Navbar */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-surface-container flex items-center justify-center">
                <Image
                  src="/logo_smi.png"
                  alt="Logo SMI"
                  fill
                  sizes="32px"
                  priority
                  className="object-cover"
                />
              </div>
              <span className="font-headline-md text-primary font-bold text-base md:text-lg">
                SMI Pengurus
              </span>
            </Link>

            <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline-block">
              Portal Admin
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl text-xs md:text-sm font-label-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">manage_accounts</span>
              <span>Kelola Anggota &amp; ACC</span>
            </Link>

            <Link
              href="/admin/pelanggaran"
              className="px-3.5 py-2 rounded-xl text-xs md:text-sm font-label-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">warning</span>
              <span>Poin Pelanggaran</span>
            </Link>

            <Link
              href="/"
              className="ml-2 px-3 py-1.5 rounded-full border border-outline/30 text-xs font-label-sm text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="hidden sm:inline">Kembali ke Web</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        {children}
      </main>
    </div>
  );
}
