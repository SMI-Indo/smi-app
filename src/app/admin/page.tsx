import { prisma } from "@/lib/prisma";
import { getPendingMembers } from "@/lib/pendingMembers";
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
    const [totalUsers, activeEvents, totalVideos, totalViolations, pendingMembers] =
      await Promise.all([
        prisma.user.count(),
        prisma.event.count({ where: { status: "UPCOMING" } }),
        prisma.video.count(),
        prisma.violationRecord.count(),
        getPendingMembers(),
      ]);

    stats = {
      totalUsers,
      pendingUsers: pendingMembers.count,
      activeEvents,
      totalVideos,
      totalViolations,
    };

    pending = pendingMembers.members;
  } catch (error) {
    console.error("Error loading admin overview page:", error);
    return <p role="alert">Ringkasan Admin gagal dimuat. Coba muat ulang halaman.</p>;
  }

  return <AdminOverviewClient initialStats={stats} initialPending={pending} />;
}
