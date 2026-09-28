import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";

export const revalidate = 0;

export async function GET() {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const [totalUsers, pendingUsers, activeEvents, totalVideos, totalViolations, recentPending] = await Promise.all([
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

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          pendingUsers,
          activeEvents,
          totalVideos,
          totalViolations,
        },
        recentPending: recentPending.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Gagal memuat statistik admin" }, { status: 500 });
  }
}
