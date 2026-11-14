import ExcelJS from "exceljs";
import { checkAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { answersSchema, fieldsSchema, isWebLink } from "@/lib/registrationFields";
import { suggestRegistrationSlug } from "../../paths";
import { participantOrder, registrationEventWhere } from "../../participants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const registeredAt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short",
});

export async function GET(_: Request, { params }: { params: Promise<{ event: string }> }) {
  if (!await checkAdminSession()) {
    return new Response("Akses khusus admin.", { status: 403, headers: privateHeaders });
  }
  const { event: route } = await params;
  const event = await prisma.event.findUnique({
    where: registrationEventWhere(route),
    select: {
      title: true, registrationSlug: true, registrationFields: true,
      registrations: { orderBy: participantOrder },
    },
  });
  if (!event) return new Response("Kegiatan tidak ditemukan.", { status: 404, headers: privateHeaders });

  const fields = new Map<string, string>();
  const configuredFields = fieldsSchema.safeParse(event.registrationFields);
  if (configuredFields.success) {
    for (const { id, label } of configuredFields.data) fields.set(id, label);
  }
  const participants = event.registrations.map((participant) => {
    const parsed = answersSchema.safeParse(participant.customAnswers);
    const answers = new Map((parsed.success ? parsed.data : []).map((answer) => [answer.id, answer]));
    for (const { id, label } of answers.values()) {
      if (!fields.has(id)) fields.set(id, label);
    }
    return { participant, answers };
  });

  const workbook = new ExcelJS.Workbook();
  workbook.title = "Peserta " + event.title;
  const sheet = workbook.addWorksheet("Peserta", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Nama lengkap dan baptis", width: 33 },
    { header: "Email", width: 36 },
    { header: "Asal paroki", width: 30 },
    { header: "Cabang", width: 24 },
    { header: "WhatsApp", width: 20 },
    { header: "Catatan", width: 32 },
    { header: "Kode registrasi", width: 30 },
    { header: "Waktu daftar (WIB)", width: 26 },
    ...Array.from(fields.values(), (label) => ({ header: label, width: 32 })),
  ];
  sheet.getRow(1).font = { bold: true };
  const fieldIds = Array.from(fields.keys());
  for (const { participant, answers } of participants) {
    sheet.addRow([
      participant.name, participant.email, participant.community, participant.category,
      participant.phone ?? "", participant.notes, participant.id, registeredAt.format(participant.createdAt),
      ...fieldIds.map((id) => {
        const answer = answers.get(id);
        if (!answer) return "";
        return answer.type === "url" && isWebLink(answer.value)
          ? { text: answer.value, hyperlink: answer.value }
          : answer.value;
      }),
    ]);
  }
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sheet.rowCount, column: sheet.columnCount } };

  const filename = "peserta-" + (suggestRegistrationSlug(event.registrationSlug ?? event.title) || "kegiatan") + ".xlsx";
  return new Response(new Uint8Array(await workbook.xlsx.writeBuffer()), {
    headers: {
      ...privateHeaders,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
