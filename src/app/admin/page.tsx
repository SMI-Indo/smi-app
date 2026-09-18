import { prisma } from "@/lib/prisma";
import { AdminMembersClient, AdminUser } from "@/components/admin/AdminMembersClient";

export const revalidate = 0; // Data admin harus selalu real-time

export default async function AdminMembersPage() {
  let users: AdminUser[] = [];

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

    users = rawUsers.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));
  } catch {
    users = [];
  }

  return <AdminMembersClient initialUsers={users} />;
}
