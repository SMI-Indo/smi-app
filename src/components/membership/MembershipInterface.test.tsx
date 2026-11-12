import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MembershipInterface, type UserProfile } from "./MembershipInterface";

vi.mock("next/image", () => ({ default: ({ alt }: { alt: string }) => <span>{alt}</span> }));

const profile: UserProfile = {
  name: "Maria", nickname: "Maria", email: "maria@example.org", image: null,
  parish: "Unit A", rank: "Mula", memberId: "SMI-001", coins: 0,
  attendanceCount: 0, violationPoints: 0, violations: [],
  cardValidUntil: null, joinedAt: "2024-01-01T00:00:00.000Z", isApproved: false, cardExpired: false,
};

describe("kartu anggota", () => {
  it("menampilkan status dan masa berlaku berdasarkan data anggota", () => {
    render(<MembershipInterface profile={profile} />);
    expect(screen.getByText("Menunggu persetujuan")).toBeInTheDocument();
    expect(screen.getByText("Belum ditentukan")).toBeInTheDocument();
    expect(screen.getByText(/1 Januari 2024/)).toBeInTheDocument();
  });

  it("tidak menampilkan kode verifikasi ketika ID belum tersedia", () => {
    render(<MembershipInterface profile={{ ...profile, memberId: null }} />);
    expect(screen.queryByLabelText("Kode anggota SMI-001")).not.toBeInTheDocument();
    expect(screen.getByText("ID belum tersedia")).toBeInTheDocument();
  });
});
