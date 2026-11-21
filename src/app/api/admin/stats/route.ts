import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPendingMembers } from "@/lib/pendingMembers";
import { checkAdminSession } from "@/lib/adminAuth";

export const revalidate = 0;

export async function GET() {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

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
    return NextResponse.json({ error: "Gagal memuat statistik admin" }, { status: 500 });
  }
}
