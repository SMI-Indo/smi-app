import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { AdminMembersManager, type MemberData } from "./AdminMembersManager";

const common = { nickname: null, phone: null, parish: null, rank: null, coins: 0, violationPoints: 0, createdAt: "2026-11-21T00:00:00Z" };

it("shows an administrator's role without an approval toggle that cannot change their access", () => {
  const administrator: MemberData = { ...common, id: "admin", name: "Maria Admin", email: "admin@example.test", role: "ADMIN", isApproved: false, memberId: null };
  render(<AdminMembersManager initialMembers={[administrator]} />);
  const row = within(screen.getByRole("row", { name: /Maria Admin/ }));
  expect(row.getByText("Pengurus")).toBeInTheDocument();
  expect(row.queryByRole("button", { name: /Pengurus/ })).not.toBeInTheDocument();
});
