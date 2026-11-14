// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
import { checkAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

vi.mock("@/lib/adminAuth", () => ({ checkAdminSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { event: { findUnique: vi.fn() } } }));

const admin = vi.mocked(checkAdminSession);
const findEvent = vi.mocked(prisma.event.findUnique);
const request = new Request("https://preview.example.org/admin/events/registration/video-natal/export?q=unrelated&page=2");
const context = { params: Promise.resolve({ event: "video-natal" }) };

beforeEach(() => vi.resetAllMocks());

it("rejects direct requests from non-admins before reading participants", async () => {
  admin.mockResolvedValue(null);
  expect((await GET(request, context)).status).toBe(403);
  expect(findEvent).not.toHaveBeenCalled();
});

it("exports a real workbook with full event data, archived answers and safe typed cells", async () => {
  admin.mockResolvedValue({} as NonNullable<Awaited<ReturnType<typeof checkAdminSession>>>);
  const link = "https://drive.google.com/example";
  findEvent.mockResolvedValue({
    id: "event-1", registrationSlug: "video-natal", title: "Video Natal",
    registrationFields: [{ id: "drive", label: "Berkas", type: "url", required: true }],
    registrations: [{
      id: "reg-1", name: "=1+1", email: "peserta@example.org", community: "Santa Maria", category: "",
      phone: "081234567", notes: "", createdAt: new Date("2026-11-14T03:30:00Z"),
      customAnswers: [
        { id: "drive", label: "Link lama", type: "url", value: link },
        { id: "legacy", label: "Jawaban lama", type: "text", value: "+asli" },
      ],
    }],
  } as unknown as Awaited<ReturnType<typeof prisma.event.findUnique>>);
  const response = await GET(request, context);
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Disposition")).toContain("peserta-video-natal.xlsx");
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(findEvent).toHaveBeenCalledWith(expect.objectContaining({
    where: { registrationSlug: "video-natal" },
    select: expect.objectContaining({ registrations: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] } }),
  }));

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await response.arrayBuffer());
  const sheet = workbook.getWorksheet("Peserta")!;
  expect(sheet.rowCount).toBe(2);
  expect(sheet.getCell("A2").type).toBe(ExcelJS.ValueType.String);
  expect(sheet.getCell("A2").value).toBe("=1+1");
  expect(sheet.getCell("E2").value).toBe("081234567");
  expect(sheet.getCell("I1").value).toBe("Berkas");
  expect(sheet.getCell("I2").hyperlink).toBe(link);
  expect(sheet.getCell("J1").value).toBe("Jawaban lama");
  expect(sheet.getCell("J2").value).toBe("+asli");
});
