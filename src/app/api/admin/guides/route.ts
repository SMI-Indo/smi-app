import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ title: z.string().trim().min(2).max(200), content: z.string().trim().min(1).max(100000) });

export async function POST(request: NextRequest) {
  try {
    if (!await checkAdminSession()) return NextResponse.json({ error: "Akses khusus pengurus." }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Judul dan isi panduan wajib diisi." }, { status: 400 });
    const guide = await prisma.liturgicalGuide.create({ data: parsed.data });
    return NextResponse.json({ guide }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Panduan tidak dapat disimpan." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!await checkAdminSession()) return NextResponse.json({ error: "Akses khusus pengurus." }, { status: 403 });
    const parsed = schema.extend({ id: z.string().min(1) }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Judul dan isi panduan wajib diisi." }, { status: 400 });
    const { id, ...data } = parsed.data;
    const guide = await prisma.liturgicalGuide.update({ where: { id }, data });
    return NextResponse.json({ guide });
  } catch {
    return NextResponse.json({ error: "Perubahan panduan tidak dapat disimpan." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!await checkAdminSession()) return NextResponse.json({ error: "Akses khusus pengurus." }, { status: 403 });
    const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    await prisma.liturgicalGuide.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Panduan tidak dapat dihapus." }, { status: 500 });
  }
}
