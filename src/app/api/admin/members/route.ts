import { NextRequest, NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/apiErrors";
import { prisma } from "@/lib/prisma";
import { authorizeAdminApi } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { updateMemberSafely, validateMemberApproval, memberMutationError } from "@/lib/memberAdmin";

export const revalidate = 0;

export async function GET() {
  const { error: authError } = await authorizeAdminApi();
  if (authError) return authError;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        phone: true,
        role: true,
        isApproved: true,
        memberId: true,
        parish: true,
        rank: true,
        coins: true,
        violationPoints: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    const issue = memberMutationError(error);
    if (issue) return apiError(issue.status, issue.message);
    console.error("Error fetching members:", error);
    return apiError(500, "Gagal memuat data pengguna");
  }
}

const createMemberSchema = z.object({
  action: z.literal("CREATE"),
  name: z.string().min(1, "Nama lengkap wajib diisi"),
  nickname: z.string().optional().nullable(),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional().nullable(),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  parish: z.string().optional().nullable(),
  rank: z.string().default("Mula"),
  role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
  coins: z.number().int().min(0).default(0),
  memberId: z.string().min(1, "Nomor Keanggotaan (Member ID) wajib diisi"),
  isApproved: z.boolean().default(true),
});

const updateApprovalSchema = z.object({
  action: z.literal("UPDATE_STATUS").optional(),
  userId: z.string().min(1),
  isApproved: z.boolean(),
  memberId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { error: authError } = await authorizeAdminApi();
  if (authError) return authError;

  try {
    const body = await readJson(req);
    if (!body || typeof body !== "object" || Array.isArray(body)) return apiError(400, "Data anggota tidak valid.");

    // Check if this is a CREATE action
    if ("action" in body && body.action === "CREATE") {
      const parsed = createMemberSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(400, parsed.error.issues[0]?.message || "Data anggota tidak valid");
      }

      const {
        name,
        nickname,
        email,
        phone,
        password,
        parish,
        rank,
        role,
        coins,
        memberId,
        isApproved,
      } = parsed.data;

      // Check duplicate email
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existingEmail) {
        return apiError(409, "Email sudah terdaftar.");
      }

      // Check duplicate memberId
      const cleanMemberId = memberId.trim().toUpperCase();
      const existingMemberId = await prisma.user.findUnique({
        where: { memberId: cleanMemberId },
      });
      if (existingMemberId) {
        return apiError(409, "Nomor anggota sudah digunakan.");
      }

      validateMemberApproval(role, isApproved, cleanMemberId);
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          nickname: nickname ? nickname.trim() : null,
          email: email.toLowerCase().trim(),
          phone: phone ? phone.trim() : null,
          password: hashedPassword,
          parish: parish ? parish.trim() : null,
          rank: rank.trim(),
          role,
          coins,
          memberId: cleanMemberId,
          isApproved,
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
          phone: true,
          role: true,
          isApproved: true,
          memberId: true,
          parish: true,
          rank: true,
          coins: true,
          violationPoints: true,
          createdAt: true,
        },
      });

      return NextResponse.json({ success: true, user: newUser }, { status: 201 });
    }

    // Default: Toggle approval / quick memberId update
    const parsed = updateApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message || "Data tidak valid");
    }

    const { userId, isApproved, memberId } = parsed.data;

    if (memberId && memberId.trim() !== "") {
      const cleanId = memberId.trim().toUpperCase();
      const existingWithId = await prisma.user.findUnique({
        where: { memberId: cleanId },
      });
      if (existingWithId && existingWithId.id !== userId) {
        return apiError(409, "Nomor anggota sudah digunakan.");
      }
    }

    const updated = await updateMemberSafely(userId, {
        isApproved,
        memberId: memberId && memberId.trim() !== "" ? memberId.trim().toUpperCase() : undefined,
    });

    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch (error) {
    const issue = memberMutationError(error);
    if (issue) return apiError(issue.status, issue.message);
    console.error("Error in POST /api/admin/members:", error);
    return apiError(500, "Gagal memproses data anggota");
  }
}
