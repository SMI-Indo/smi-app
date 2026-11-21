import { Prisma } from "@prisma/client";
import { checkAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { withViolationPoints } from "@/lib/violationTotals";

type Member = {
  id: string;
  name: string | null;
  email: string;
  memberId: string | null;
  parish: string | null;
  phone: string | null;
};

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (!await checkAdminSession()) return Response.json({ error: "Akses khusus pengurus." }, { status: 403, headers });
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2 || q.length > 120) return Response.json({ members: [] }, { headers });
    const isPhone = /^[+\d().\s-]+$/.test(q) && /\d{7}/.test(q.replace(/\D/g, ""));
    const digits = q.replace(/\D/g, "").replace(/^(62|0)/, "");
    const matches = isPhone
      ? Prisma.sql`regexp_replace(regexp_replace("phone", '[^0-9]', '', 'g'), '^(62|0)', '') = ${digits} OR lower("memberId") = lower(${q})`
      : Prisma.sql`strpos(lower(coalesce("name", '')), lower(${q})) > 0
        OR strpos(lower("email"), lower(${q})) > 0
        OR strpos(lower(coalesce("memberId", '')), lower(${q})) > 0`;
    const members = await prisma.$queryRaw<Member[]>`
      SELECT "id", "name", "email", "memberId", "parish", "phone"
      FROM "User" WHERE "role" = 'MEMBER' AND (${matches})
      ORDER BY "name" ASC NULLS LAST, "id" ASC LIMIT 20
    `;
    const scoredMembers = await withViolationPoints(prisma, members);
    return Response.json({ members: scoredMembers.map(({ phone, ...member }) => ({
      ...member, phoneSuffix: phone?.replace(/\D/g, "").slice(-4) || null,
    })) }, { headers });
  } catch {
    return Response.json({ error: "Pencarian anggota gagal. Coba lagi." }, { status: 500, headers });
  }
}
