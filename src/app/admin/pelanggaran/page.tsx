import { prisma } from "@/lib/prisma";
import {
  AdminViolationsClient,
  ViolationItem,
  MemberOption,
} from "@/components/admin/AdminViolationsClient";

export const revalidate = 0; // Data harus selalu real-time

export default async function AdminPelanggaranPage() {
  let violations: ViolationItem[] = [];
  let members: MemberOption[] = [];

  try {
    const [rawViolations, rawMembers] = await Promise.all([
      prisma.violationRecord.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              memberId: true,
              violationPoints: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { role: "MEMBER" },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          memberId: true,
          violationPoints: true,
        },
      }),
    ]);

    violations = rawViolations.map((v) => ({
      id: v.id,
      points: v.points,
      reason: v.reason,
      severity: v.severity,
      followUp: v.followUp,
      status: v.status,
      date: v.date.toISOString(),
      user: v.user,
    }));

    members = rawMembers;
  } catch {
    violations = [];
    members = [];
  }

  return (
    <AdminViolationsClient
      initialViolations={violations}
      members={members}
    />
  );
}
