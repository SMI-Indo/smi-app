import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AdminViolationsClient } from "./AdminViolationsClient";
afterEach(cleanup);
const members = [{ id: "member-1", name: "Maria", email: "maria@smi.org", memberId: "SMI-1", violationPoints: 0 }];
it("disables recording on a database load failure", () => {
 render(<AdminViolationsClient initialViolations={[]} members={[]} loadFailed />);
 expect(screen.getByRole("alert")).toHaveTextContent("Data belum dapat dimuat");
 expect(screen.getByRole("button", { name: "Catat Poin Pelanggaran" })).toBeDisabled();
});
it("only offers screenshot selection when private evidence is enabled", () => {
 const { rerender } = render(<AdminViolationsClient initialViolations={[]} members={members} />);
 expect(screen.queryByLabelText("Pilih gambar")).toBeNull();
 rerender(<AdminViolationsClient initialViolations={[]} members={members} evidenceEnabled />);
 expect(screen.getByLabelText("Pilih gambar")).toHaveAttribute("accept", "image/png,image/jpeg,image/webp");
});
it("can search members by their membership ID", () => {
 render(<AdminViolationsClient initialViolations={[]} members={members} />);
 fireEvent.change(screen.getByRole("searchbox"), { target: { value: "SMI-1" } });
 expect(screen.getByRole("option", { name: /Maria/ })).toBeInTheDocument();
});
