import { expect, it } from "vitest";
import { countViolationPoints, isActiveViolation } from "./violations";

it("keeps resolved points and excludes cancelled points from the ledger", () => {
  expect(countViolationPoints([
    { points: 5, status: "OPEN" }, { points: 10, status: "IN_PROGRESS" },
    { points: 7, status: "RESOLVED" }, { points: 20, status: "CANCELLED" },
  ])).toBe(22);
  expect(countViolationPoints([])).toBe(0);
  expect(isActiveViolation("RESOLVED")).toBe(false);
});
