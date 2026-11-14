import { prisma } from "@/lib/prisma";
import {
  AdminViolationsClient,
  ViolationItem,
  MemberOption,
} from "@/components/admin/AdminViolationsClient";

export const revalidate = 0; // Data harus selalu real-time

export default async function AdminPelanggaranPage() {
  const evidenceEnabled = process.env.ENABLE_VIOLATION_EVIDENCE === "true";
  let loadFailed = false;
  let violations: ViolationItem[] = [];
  let members: MemberOption[] = [];

  try {
    const [rawViolations, rawMembers] = await Promise.all([
      prisma.violationRecord.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          ...(evidenceEnabled && { evidence: { select: { id: true, fileName: true } } }),
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
      evidence: "evidence" in v ? v.evidence as { id: string; fileName: string }[] : [],
    }));

    members = rawMembers;
  } catch {
    loadFailed = true;
    violations = [];
    members = [];
  }

  return (
    <AdminViolationsClient
      initialViolations={violations}
      members={members}
      evidenceEnabled={evidenceEnabled}
      loadFailed={loadFailed}
    />
  );
}
