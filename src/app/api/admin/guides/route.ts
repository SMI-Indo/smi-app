import { NextRequest, NextResponse } from "next/server";
import { apiError, hasDatabaseErrorCode, readJson } from "@/lib/apiErrors";
import { z } from "zod";
import { authorizeAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ title: z.string().trim().min(2).max(200), content: z.string().trim().min(1).max(100000) });

export async function POST(request: NextRequest) {
  try {
    const { error } = await authorizeAdminApi();
    if (error) return error;
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return apiError(400, "Judul dan isi panduan wajib diisi.");
    const guide = await prisma.liturgicalGuide.create({ data: parsed.data });
    return NextResponse.json({ guide }, { status: 201 });
  } catch {
    return apiError(500, "Panduan tidak dapat disimpan.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { error } = await authorizeAdminApi();
    if (error) return error;
    const parsed = schema.extend({ id: z.string().min(1) }).safeParse(await readJson(request));
    if (!parsed.success) return apiError(400, "Judul dan isi panduan wajib diisi.");
    const { id, ...data } = parsed.data;
    const guide = await prisma.liturgicalGuide.update({ where: { id }, data });
    return NextResponse.json({ guide });
  } catch (error) {
    if (hasDatabaseErrorCode(error, "P2025")) return apiError(404, "Panduan tidak ditemukan.");
    return apiError(500, "Perubahan panduan tidak dapat disimpan.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error } = await authorizeAdminApi();
    if (error) return error;
    const parsed = z.object({ id: z.string().min(1) }).safeParse(await readJson(request));
    if (!parsed.success) return apiError(400, "ID tidak valid.");
    await prisma.liturgicalGuide.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (hasDatabaseErrorCode(error, "P2025")) return apiError(404, "Panduan tidak ditemukan.");
    return apiError(500, "Panduan tidak dapat dihapus.");
  }
}
