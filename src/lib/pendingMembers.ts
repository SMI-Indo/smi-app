import { prisma } from "./prisma";

type PendingMemberRow = {
  id: string;
  name: string | null;
  nickname: string | null;
  email: string;
  parish: string | null;
  memberId: string | null;
  createdAt: Date;
  total: bigint;
};

// PostgreSQL btrim defaults to spaces, while JavaScript trim also recognizes these whitespace characters.
const trimCharacters = "\t\n\v\f\r \u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF";

export async function getPendingMembers() {
  const rows = await prisma.$queryRaw<PendingMemberRow[]>`
    SELECT "id", "name", "nickname", "email", "parish", "memberId", "createdAt",
      count(*) OVER () AS total
    FROM "User"
    WHERE "role" = 'MEMBER' AND (
      NOT "isApproved" OR "memberId" IS NULL OR btrim("memberId", ${trimCharacters}) = ''
    )
    ORDER BY "createdAt" DESC, "id" DESC
    LIMIT 5
  `;
  return {
    count: Number(rows[0]?.total ?? 0),
    members: rows.map(({ id, name, nickname, email, parish, memberId, createdAt }) => ({
      id, name, nickname, email, parish, memberId, createdAt: createdAt.toISOString(),
    })),
  };
}
