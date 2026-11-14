import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RegistrationForm } from "./RegistrationForm";
vi.mock("./actions", () => ({ register: vi.fn() }));
afterEach(cleanup);
it("asks guests for email", () => {
  render(<RegistrationForm slug="temu" categories={[]} fields={[]} />);
  expect(screen.getByLabelText("Email")).toBeRequired();
});
it("shows account email without an editable email field", () => {
  render(<RegistrationForm slug="temu" categories={[]} fields={[]} accountEmail="member@smi.org" />);
  expect(screen.getByText("member@smi.org")).toBeVisible();
  expect(document.querySelector('input[name="email"]')).toBeNull();
  expect(screen.getByLabelText("Nama lengkap termasuk nama baptis")).toBeEnabled();
  expect(screen.getByLabelText("Asal paroki")).toBeEnabled();
});
