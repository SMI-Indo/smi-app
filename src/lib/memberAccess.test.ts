import { expect, it } from "vitest";
import { canAccessMemberFeatures, memberAccessStatus } from "./memberAccess";

it.each([null, "", " \t\n"])("requires an actual ID for an approved member (%j)", (memberId) => {
  const member = { role: "MEMBER", isApproved: true, memberId } as const;
  expect(canAccessMemberFeatures(member)).toBe(false);
  expect(memberAccessStatus(member)).toBe("MISSING_ID");
});

it("keeps an active member and an administrator eligible", () => {
  expect(canAccessMemberFeatures({ role: "MEMBER", isApproved: true, memberId: "SMI-1" })).toBe(true);
  expect(canAccessMemberFeatures({ role: "ADMIN", isApproved: false, memberId: null })).toBe(true);
});

it("represents missing approval without inferring a reason or sanction", () => {
  const member = { role: "MEMBER", isApproved: false, memberId: "SMI-1" } as const;
  expect(canAccessMemberFeatures(member)).toBe(false);
  expect(memberAccessStatus(member)).toBe("NOT_APPROVED");
});
