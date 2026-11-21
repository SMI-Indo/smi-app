import { prisma } from "./prisma";
import { hasMemberId } from "./memberAccess";

export class MemberPolicyError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}
export type MemberPatch = Partial<{
  name: string; nickname: string | null; email: string; phone: string | null;
  parish: string | null; rank: string | null; role: "ADMIN" | "MEMBER";
  coins: number; isApproved: boolean; memberId: string | null;
}>;
const memberSelection = {
  id: true, name: true, nickname: true, email: true, phone: true, role: true,
  isApproved: true, memberId: true, parish: true, rank: true, coins: true,
  violationPoints: true, createdAt: true, updatedAt: true,
} as const;

export function validateMemberApproval(role: string, approved: boolean, memberId: string | null | undefined) {
  if (role === "MEMBER" && approved && !hasMemberId(memberId)) {
    throw new MemberPolicyError("Nomor anggota wajib diisi sebelum menyetujui anggota.");
  }
}

export async function updateMemberSafely(id: string, data: MemberPatch) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({ where: { id }, select: { role: true, isApproved: true, memberId: true } });
    if (!current) throw new MemberPolicyError("Anggota tidak ditemukan.", 404);
    if (current.role === "ADMIN" && data.role === "MEMBER" && await tx.user.count({ where: { role: "ADMIN" } }) <= 1) {
      throw new MemberPolicyError("Tidak dapat menurunkan role admin terakhir.");
    }
    validateMemberApproval(data.role ?? current.role, data.isApproved ?? current.isApproved,
      data.memberId === undefined ? current.memberId : data.memberId);
    return tx.user.update({ where: { id }, data, select: memberSelection });
  }, { isolationLevel: "Serializable" });
}

export async function deleteMemberSafely(id: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({ where: { id }, select: { role: true } });
    if (!current) throw new MemberPolicyError("Anggota tidak ditemukan.", 404);
    if (current.role === "ADMIN" && await tx.user.count({ where: { role: "ADMIN" } }) <= 1) {
      throw new MemberPolicyError("Tidak dapat menghapus admin terakhir.");
    }
    if (await tx.violationRecord.count({ where: { userId: id } }) > 0) {
      throw new MemberPolicyError("Anggota memiliki riwayat pelanggaran. Nonaktifkan persetujuannya untuk mempertahankan riwayat dan bukti.");
    }
    await tx.user.delete({ where: { id } });
  }, { isolationLevel: "Serializable" });
}

export function memberMutationError(error: unknown) {
  if (error instanceof MemberPolicyError) return { message: error.message, status: error.status };
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P2034") return { message: "Data sedang diperbarui. Muat ulang dan coba lagi.", status: 409 };
    if (error.code === "P2002") return { message: "Email atau nomor anggota sudah digunakan.", status: 409 };
    if (error.code === "P2003") return { message: "Anggota memiliki data terkait, termasuk pesanan. Nonaktifkan persetujuannya untuk mempertahankan riwayat.", status: 409 };
  }
  return null;
}
