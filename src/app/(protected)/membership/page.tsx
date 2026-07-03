import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MembershipInterface } from "@/components/membership/MembershipInterface";

export const revalidate = 0; // Membutuhkan data profil real-time

export default async function MembershipPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Ambil profil lengkap anggota dari database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login");
  }

  const profile = {
    name: user.name || "Anggota SMI",
    nickname: user.nickname || "Anggota",
    email: user.email,
    image: user.image,
    parish: user.parish || "Belum Mengisi Paroki",
    rank: user.rank || "Mula",
    memberId: user.memberId || "Belum Terdaftar",
    coins: user.coins,
    attendanceCount: user.attendanceCount,
    cardValidUntil: user.cardValidUntil?.toISOString() || new Date().toISOString(),
  };

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">badge</span>
          </div>
          <h1 className="font-headline-lg text-primary">Kartu Anggota Digital</h1>
          <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto text-sm md:text-base">
            Identitas resmi digital dan riwayat statistik pengabdian liturgi sebagai Putra-Putri Altar Nusantara.
          </p>
        </div>

        {/* Membership Profile Card interface dashboard */}
        <MembershipInterface profile={profile} />
      </div>
    </main>
  );
}
