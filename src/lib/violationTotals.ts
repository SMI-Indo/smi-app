import type { Prisma } from "@prisma/client";
import { cancelledViolationStatus } from "./violations";

type ViolationTotalsClient = Pick<Prisma.TransactionClient, "violationRecord">;

export async function violationPointsByMember(db: ViolationTotalsClient, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, number>();
  const totals = await db.violationRecord.groupBy({
    by: ["userId"],
    where: { userId: { in: [...new Set(userIds)] }, status: { not: cancelledViolationStatus } },
    _sum: { points: true },
  });
  return new Map(totals.map(({ userId, _sum }) => [userId, _sum.points ?? 0]));
}

export async function withViolationPoints<T extends { id: string }>(db: ViolationTotalsClient, members: T[]) {
  const totals = await violationPointsByMember(db, members.map(({ id }) => id));
  return members.map((member) => ({ ...member, violationPoints: totals.get(member.id) ?? 0 }));
}
