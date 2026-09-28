import { prisma } from "@/lib/prisma";
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
        role: true,
        isApproved: true,
        memberId: true,
        parish: true,
        rank: true,
        coins: true,
        violationPoints: true,
        createdAt: true,
      },
    });

    members = rawUsers.map((u) => ({
      ...u,
      role: u.role as "MEMBER" | "ADMIN",
      createdAt: u.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error loading members page:", error);
  }

  return <AdminMembersManager initialMembers={members} />;
}
