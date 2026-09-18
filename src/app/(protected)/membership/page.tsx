import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MembershipInterface, UserProfile } from "@/components/membership/MembershipInterface";

export const revalidate = 0; // Membutuhkan data profil real-time

export default async function MembershipPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  let profile: UserProfile | null = null;
  let hasDbError = false;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        violations: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      redirect("/login");
    }

    profile = {
      name: user.name || "Anggota SMI",
      nickname: user.nickname || "Anggota",
      email: user.email,
      image: user.image,
      parish: user.parish || "Komunitas Daring",
      rank: user.rank || "Mula",
      memberId: user.memberId || "Belum Terdaftar",
      coins: user.coins,
      attendanceCount: user.attendanceCount,
      violationPoints: user.violationPoints || 0,
      violations: user.violations.map((v) => ({
        id: v.id,
        points: v.points,
        reason: v.reason,
        date: v.date.toISOString(),
      })),
      cardValidUntil: user.cardValidUntil?.toISOString() || new Date().toISOString(),
    };
  } catch {
    hasDbError = true;
  }

  if (hasDbError || !profile) {
    return (
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
          <h1 className="font-headline-lg text-primary">Kartu Anggota Digital</h1>
          <div className="p-8 rounded-2xl bg-surface-container border border-outline-variant text-on-surface-variant max-w-md mx-auto">
            <p>Terjadi kendala menghubungkan ke database server. Silakan coba muat ulang beberapa saat lagi.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">badge</span>
          </div>
          <h1 className="font-headline-lg text-primary">Kartu Anggota Digital</h1>
          <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto text-sm md:text-base">
            Identitas resmi digital, perolehan koin, dan catatan kedisiplinan Sahabat Misdinar Indonesia.
          </p>
        </div>

        <MembershipInterface profile={profile} />
      </div>
    </main>
  );
}
