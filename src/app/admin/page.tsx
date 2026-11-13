import { prisma } from "@/lib/prisma";
import {
  AdminOverviewClient,
  AdminStats,
  PendingMember,
} from "@/components/admin/AdminOverviewClient";

export const revalidate = 0; // Data admin selalu real-time

export default async function AdminOverviewPage() {
  let stats: AdminStats = {
    totalUsers: 0,
    pendingUsers: 0,
    activeEvents: 0,
    totalVideos: 0,
    totalViolations: 0,
  };

  let pending: PendingMember[] = [];

  try {
    const [totalUsers, pendingUsers, activeEvents, totalVideos, totalViolations, rawPending] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isApproved: false } }),
        prisma.event.count({ where: { status: "UPCOMING" } }),
        prisma.video.count(),
        prisma.violationRecord.count(),
        prisma.user.findMany({
          where: { isApproved: false },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
            parish: true,
            createdAt: true,
          },
        }),
      ]);

    stats = {
      totalUsers,
      pendingUsers,
      activeEvents,
      totalVideos,
      totalViolations,
    };

    pending = rawPending.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error loading admin overview page:", error);
    return <p role="alert">Ringkasan Admin gagal dimuat. Coba muat ulang halaman.</p>;
  }

  return <AdminOverviewClient initialStats={stats} initialPending={pending} />;
}
