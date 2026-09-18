import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const subscribeSchema = z.object({
  contact: z.string().refine((val) => {
    // Basic email format check
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    // Indonesian phone number check (starting with 08 or +62)
    const isPhone = /^(?:\+62|08)[0-9]{8,13}$/.test(val);
    return isEmail || isPhone;
  }, {
    message: "Kontak harus merupakan Email valid atau No. WhatsApp Indonesia (+62/08)",
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Save subscription in database
    const subscription = await prisma.newsletterSubscription.upsert({
      where: { contact: result.data.contact },
      update: {},
      create: { contact: result.data.contact },
    });

    return NextResponse.json({ success: true, data: subscription }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
