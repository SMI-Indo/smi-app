type MemberAccess = { role: string; isApproved: boolean; memberId?: string | null };

export function hasMemberId(memberId: string | null | undefined) {
  return Boolean(memberId?.trim());
}

export function memberAccessStatus({ role, isApproved, memberId }: MemberAccess) {
  if (role === "ADMIN") return "ADMIN";
  if (!isApproved) return "NOT_APPROVED";
  return hasMemberId(memberId) ? "ACTIVE" : "MISSING_ID";
}

export function canAccessMemberFeatures(member: MemberAccess) {
  const status = memberAccessStatus(member);
  return status === "ADMIN" || status === "ACTIVE";
}
