import { prisma } from "@/lib/prisma";
import { withViolationPoints } from "@/lib/violationTotals";
import {
  AdminMembersManager,
  MemberData,
} from "@/components/admin/AdminMembersManager";

export const revalidate = 0; // Data admin selalu real-time

export default async function AdminMembersPage() {
  let members: MemberData[] = [];

  try {
    const rawUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        phone: true,
        role: true,
        isApproved: true,
        memberId: true,
        parish: true,
        rank: true,
        coins: true,
        createdAt: true,
      },
    });

    members = (await withViolationPoints(prisma, rawUsers)).map((u) => ({
      ...u,
      role: u.role as "MEMBER" | "ADMIN",
      createdAt: u.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error loading members page:", error);
    return <p role="alert">Daftar anggota gagal dimuat. Coba muat ulang halaman.</p>;
  }

  return <AdminMembersManager initialMembers={members} />;
}
