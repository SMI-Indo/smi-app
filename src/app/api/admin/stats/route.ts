import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiErrors";
import { prisma } from "@/lib/prisma";
import { getPendingMembers } from "@/lib/pendingMembers";
import { authorizeAdminApi } from "@/lib/adminAuth";

export const revalidate = 0;

export async function GET() {
  const { error: authError } = await authorizeAdminApi();
  if (authError) return authError;

  try {
    const [totalUsers, activeEvents, totalVideos, totalViolations, pendingMembers] = await Promise.all([
      prisma.user.count(),
      prisma.event.count({ where: { status: "UPCOMING" } }),
      prisma.video.count(),
      prisma.violationRecord.count(),
      getPendingMembers(),
    ]);

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          pendingUsers: pendingMembers.count,
          activeEvents,
          totalVideos,
          totalViolations,
        },
        recentPending: pendingMembers.members,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return apiError(500, "Gagal memuat statistik admin");
  }
}
