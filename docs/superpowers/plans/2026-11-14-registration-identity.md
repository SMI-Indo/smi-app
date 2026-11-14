# Registration identity implementation plan

Goal: use server-verified account email for signed-in registration; preserve guests.
Spec: ../specs/2026-11-14-registration-identity-design.md (approved in chat).
Execution: sequential inline, on main only. Preserve palette, NextAuth and existing event rules.

## Task 1: registration identity
- [x] Add action tests: account email overrides forged or absent email; guests must supply valid email; session failure fails closed; expired session cannot use missing email; event/duplicate protections preserved.
- [x] Observe failures, then resolve session inside register before validation.
- [x] Add form tests for guest/account identity; render account summary from server session, not an editable email field.
- [ ] Verify tests, lint, type check, build. Treat Prisma download/network denial as an environment blocker, never bypass verification.

## Review focus
Stale form sessions, revoked accounts, forged email, guest regressions, database errors that must not become successful registrations.

## Subsequent stages
Follow the ordered backlog in the spec. Plan each stage before coding, keeping verified changes separate. Private evidence storage and database schema deployment require working runtime bindings; do not simulate those capabilities.
