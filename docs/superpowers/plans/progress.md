# Sequential workflow implementation progress

Branch: main. Baseline: 153a08b. Never modify or push master.
Stage 1: registration account identity implemented; targeted tests RED→GREEN; full suite 62/62 passed, lint passed. Extra custom-field/duplicate coverage added. TypeScript blocked by unavailable generated Prisma client; binaries.prisma.sh CONNECT 403 confirmed. No runtime/database success claimed.
Ruling: retain guest registration and editable participant name/parish. Never trust submitted email when account session is active.
Stage 2 next: approval/member ID consistency and last-admin protection without schema changes; password session revocation requires further design/validation.
Storage evidence: no available Supabase connector, database URL or Storage binding. Do not create public evidence URLs or pretend uploads work.
Stage 2: member policy helper tests and credential-reset/session tests passed (21 focused tests including password-change API). Self-service password page added. Existing JWT sessions will require one fresh login after deployment because old tokens lack the credential fingerprint.
User confirmed evidence is admin-only. User superseded manual attendance: design automatic event attendance with scheduled open/close and special code. Saved separate design; no attendance schema deployed.
