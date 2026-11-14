# Sequential workflow implementation progress

Branch: main. Baseline: 153a08b. Never modify or push master.
Stage 1: registration account identity implemented; targeted tests RED→GREEN; full suite 62/62 passed, lint passed. Extra custom-field/duplicate coverage added. TypeScript blocked by unavailable generated Prisma client; binaries.prisma.sh CONNECT 403 confirmed. No runtime/database success claimed.
Ruling: retain guest registration and editable participant name/parish. Never trust submitted email when account session is active.
Stage 2 next: approval/member ID consistency and last-admin protection without schema changes; password session revocation requires further design/validation.
Storage evidence: no available Supabase connector, database URL or Storage binding. Do not create public evidence URLs or pretend uploads work.
Stage 2: member policy helper tests and credential-reset/session tests passed (21 focused tests including password-change API). Self-service password page added. Existing JWT sessions will require one fresh login after deployment because old tokens lack the credential fingerprint.
User confirmed evidence is admin-only. User superseded manual attendance: design automatic event attendance with scheduled open/close and special code. Saved separate design; no attendance schema deployed.
Stage 3: optional admin-only violation evidence implemented behind ENABLE_VIOLATION_EVIDENCE (default false). Additive SQL, private bucket validation, server image signatures/limits, browser preview/compression, scoped evidence endpoint and durable cleanup journal included. Database/Storage integration and schema deployment remain BLOCKED by absent preview bindings and Prisma network access. No production schema changes executed.
Final independent review: fixed password-reset/login race by carrying the fingerprint of the verified password; fixed bcrypt's 72-byte password limit; journal upload paths before network writes, retain failed cleanup for retry, collect evidence independently of feature flag, and prevent user deletion cascading disciplinary evidence. Regression tests exercised RED→GREEN.
Hallmark: existing red/gold/cream palette preserved. Static sweep used on touched UI; rendering admin UI is not verified because current environment cannot generate Prisma/start the database-backed workflow. Do not claim a visual/render pass.
Ruling: evidence upload is capped at 3 x 1 MiB after optional browser image compression to fit Vercel function request limits. Original images over 1 MiB may be resized/re-encoded; UI explicitly asks administrators to check readability.
Ruling: proof is admin-only as requested. No public evidence URLs or browser service-role credentials.
Ruling: automatic attendance with scheduled form/code is a saved design, not implemented or deployed; further stages wait on validation of the current database-backed stage.
Remaining: secure preview variables, apply network draft, preview evidence SQL, generated client/build, real admin/member tests, visual phone checks and attendance implementation. Main push is authorized; master remains unchanged.

Final verification: 21 test files, 97 tests passed; lint and git diff --check passed. Next production bundle compiled, then failed type checking because Prisma Client types are absent; checksum download still blocked by proxy 403. Full type checking and database/storage/visual integration remain unverified.
