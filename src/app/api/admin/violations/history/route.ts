import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { checkAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const filters = z.object({
  memberId: z.string().max(128).optional(),
  status: z.enum(["", "OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"]).optional(),
  from: z.union([z.literal(""), z.iso.date()]).optional(),
  to: z.union([z.literal(""), z.iso.date()]).optional(),
  page: z.coerce.number().int().positive().max(1_000_000).default(1),
});

const dateAtWib = (value: string) => new Date(value + "T00:00:00+07:00");

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (!await checkAdminSession()) return Response.json({ error: "Akses khusus pengurus." }, { status: 403, headers });
    const parsed = filters.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success || (parsed.data.from && parsed.data.to && parsed.data.from > parsed.data.to)) {
      return Response.json({ error: "Filter riwayat tidak valid." }, { status: 400, headers });
    }
    const { memberId, status, from, to } = parsed.data;
    const where: Prisma.ViolationRecordWhereInput = {
      userId: memberId || undefined,
      status: status || undefined,
      date: from || to ? {
        gte: from ? dateAtWib(from) : undefined,
        lt: to ? new Date(dateAtWib(to).getTime() + 86_400_000) : undefined,
      } : undefined,
    };
    const result = await prisma.$transaction(async (tx) => {
      const pageSize = 20;
      const total = await tx.violationRecord.count({ where });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const page = Math.min(parsed.data.page, totalPages);
      const violations = await tx.violationRecord.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true, memberId: true, violationPoints: true } },
          ...(process.env.ENABLE_VIOLATION_EVIDENCE === "true" && { evidence: { select: { id: true, fileName: true } } }),
        },
      });
      return { violations, total, page, totalPages, pageSize };
    }, { isolationLevel: "RepeatableRead" });
    return Response.json(result, { headers });
  } catch {
    return Response.json({ error: "Riwayat gagal dimuat. Coba lagi." }, { status: 500, headers });
  }
}
