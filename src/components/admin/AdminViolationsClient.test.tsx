import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminViolationsClient } from "./AdminViolationsClient";

const fetchRequest = vi.fn();
const member = { id: "member-1", name: "Maria", email: "maria@example.test", memberId: "SMI-1", parish: null, phoneSuffix: null };
const record = { id: "violation-1", points: 5, reason: "Alasan", severity: "RINGAN", status: "OPEN", date: "2026-11-21T00:00:00Z", followUp: null, user: member };

beforeEach(() => {
  fetchRequest.mockReset();
  fetchRequest.mockImplementation(async (url: string) => {
    if (url === "/api/admin/violations/members") return Response.json({ members: [member] });
    return Response.json({ violations: [record], page: url.includes("page=2") ? 2 : 1, totalPages: 2, total: 21 });
  });
  vi.stubGlobal("fetch", fetchRequest);
});
afterEach(() => vi.unstubAllGlobals());

async function selectMember() {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "SMI-1" } });
  fireEvent.click(screen.getByRole("button", { name: "Cari" }));
  const matches = await screen.findAllByRole("button", { name: /Maria/ });
  fireEvent.click(matches[0]);
}

it("reports an unavailable history and keeps it retryable", async () => {
  fetchRequest.mockResolvedValueOnce(Response.json({ error: "Riwayat gagal dimuat." }, { status: 500 }));
  render(<AdminViolationsClient />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Riwayat gagal dimuat.");
  expect(screen.queryByRole("button", { name: "Catat untuk anggota ini" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
  expect(await screen.findByText("Halaman 1 dari 2")).toBeInTheDocument();
});

it("searches by membership ID and shows private evidence input only when enabled", async () => {
  const { rerender } = render(<AdminViolationsClient />);
  await selectMember();
  expect(fetchRequest).toHaveBeenCalledWith("/api/admin/violations/members", expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ q: "SMI-1" }),
  }));
  expect(screen.queryByLabelText("Pilih gambar")).not.toBeInTheDocument();
  rerender(<AdminViolationsClient evidenceEnabled />);
  expect(screen.getByLabelText("Pilih gambar")).toHaveAttribute("accept", "image/png,image/jpeg,image/webp");
});

it("loads the second page from the API totalPages contract", async () => {
  render(<AdminViolationsClient />);
  expect(await screen.findByText("Halaman 1 dari 2")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Berikutnya" }));
  await waitFor(() => expect(screen.getByText("Halaman 2 dari 2")).toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Berikutnya" })).toBeDisabled();
});

it("clears draft violation details when another member is selected", async () => {
  const otherMember = { ...member, id: "member-2", name: "Yohanes", memberId: "SMI-2" };
  fetchRequest.mockImplementation(async (url: string) => url === "/api/admin/violations/members"
    ? Response.json({ members: [member, otherMember] })
    : Response.json({ violations: [], page: 1, totalPages: 1, total: 0 }));
  render(<AdminViolationsClient />);
  await selectMember();
  fireEvent.change(screen.getByLabelText("Alasan"), { target: { value: "Catatan Maria" } });
  fireEvent.click(screen.getByRole("button", { name: /Yohanes/ }));
  expect(screen.getByLabelText("Alasan")).toHaveValue("");
});
