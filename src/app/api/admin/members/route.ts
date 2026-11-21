import { NextRequest, NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/apiErrors";
import { prisma } from "@/lib/prisma";
import { authorizeAdminApi } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { updateMemberSafely, validateMemberApproval, memberMutationError } from "@/lib/memberAdmin";
import { accountEmail, memberName, memberNumber, newPassword, optionalProfileText, recordId } from "@/lib/accountInput";

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
  name: memberName,
  nickname: optionalProfileText,
  email: accountEmail,
  phone: optionalProfileText,
  password: newPassword,
  parish: optionalProfileText,
  rank: z.string().trim().max(160).default("Mula"),
  role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
  coins: z.number().int().min(0).default(0),
  memberId: memberNumber.min(1, "Nomor anggota wajib diisi"),
  isApproved: z.boolean().default(true),
});

const updateApprovalSchema = z.object({
  action: z.literal("UPDATE_STATUS").optional(),
  userId: recordId,
  isApproved: z.boolean(),
  memberId: memberNumber.optional(),
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
        where: { email },
      });
      if (existingEmail) {
        return apiError(409, "Email sudah terdaftar.");
      }

      // Check duplicate memberId
      const existingMemberId = await prisma.user.findUnique({
        where: { memberId },
      });
      if (existingMemberId) {
        return apiError(409, "Nomor anggota sudah digunakan.");
      }

      validateMemberApproval(role, isApproved, memberId);
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name,
          nickname: nickname || null,
          email,
          phone: phone || null,
          password: hashedPassword,
          parish: parish || null,
          rank,
          role,
          coins,
          memberId,
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

    if (memberId) {
      const existingWithId = await prisma.user.findUnique({
        where: { memberId },
      });
      if (existingWithId && existingWithId.id !== userId) {
        return apiError(409, "Nomor anggota sudah digunakan.");
      }
    }

    const updated = await updateMemberSafely(userId, {
      isApproved,
      memberId: memberId || undefined,
    });

    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch (error) {
    const issue = memberMutationError(error);
    if (issue) return apiError(issue.status, issue.message);
    console.error("Error in POST /api/admin/members:", error);
    return apiError(500, "Gagal memproses data anggota");
  }
}
