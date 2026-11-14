# Registration identity and staged workflow improvements

## Constraints

All changes target main; never push or merge into master. Retain NextAuth, Prisma, existing routes, and the existing SMI palette and fonts. Work sequentially, verifying each stage before starting the next. This document proposes stage 1; later stages require their own implementation details.

## Stage 1: Registration without retyping an account email

Goal: an authenticated member can register using their account email without entering it again. Guest registration remains available.

Approach: resolve the NextAuth session on the server when rendering the form and again when submitting. For an active session with an email, show a non-editable account email summary instead of an email input. The server uses the session email regardless of any email supplied in FormData. Guests keep the required email input. This is preferable to browser-only autofill, which cannot establish trusted identity.

Keep name and parish editable; do not silently replace the participant's information. Preserve event categories, custom fields, terms, deadlines, capacity checks, duplicate checks, confirmation code, and email delivery behavior.

If an authenticated submission no longer has an active session, ask the user to reload/sign in or complete guest email entry; do not silently register under stale browser identity. If session resolution itself fails, return a retryable error rather than treating the request as an anonymous registration.

Files: modify src/app/daftar/[slug]/page.tsx, RegistrationForm.tsx, and actions.ts. Add focused action and form tests beside those files. Add narrowly scoped styles only if necessary; no global visual overhaul in this stage.

Verification: guest valid/invalid email; logged-in form without email input; forged email ignored; expired/revoked session without a guest email rejected; session failure; duplicate registration; closed/full event; pending, error and success form states. Run relevant tests, lint, TypeScript and build; report environment blockers separately.

## Sequential backlog

2. Account lifecycle: approval/member ID consistency, last-admin protection, password reset/session revocation, and a usable member password-change flow.
3. Mobile violation workflow: member search, proposed reason presets with editable detail, date, severity, points and follow-up; private screenshot upload with gallery/camera selection, preview/removal, progress and retry. Validate file content/type/size server-side, restrict evidence access to authorized roles, and define retention/deletion. Do not use public evidence URLs or assume Supabase Storage credentials exist. Resolve the storage setup before implementation.
4. Attendance and coin eligibility: define and implement admin verification before rewarding attendance/service; preserve existing transaction concurrency protections.
5. Coin reward fulfillment: admin-processable redemption records, stock and balance consistency, and traceable manual adjustments.
6. Membership operations: attendance management, card validity and clear membership status semantics.
7. Merchandise operations: explicit payment/fulfillment states, reservation expiry and communication outcomes.
8. Content and communication: violation resolution semantics, notification delivery/retry, newsletter administration, video metrics, quiz validation, and abuse protection.

## Hallmark direction

Audience: members registering for events and administrators working on phones. Tone: practical, calm, readable. Keep the existing red primary (#941a00), warm gold (#fdb242), cream background (#fdf9f3), logos and fonts. Use existing tokens, visible labels, clear focus/error/pending states, comfortable touch targets and single-column mobile forms. Redesign each affected screen alongside its workflow, preserving unrelated routes and behavior. Use real existing content; add no decorative metrics or marketing sections.

## Approval boundary

No application code or dependency changes are included in this document. Stage 1 design awaits user review; the mobile evidence workflow is a proposal, not an implemented or configured service.
