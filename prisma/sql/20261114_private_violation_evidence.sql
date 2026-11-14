-- Apply to the preview Supabase project first. This script is additive.
CREATE TABLE IF NOT EXISTS "ViolationEvidence" (
  "id" TEXT PRIMARY KEY,
  "violationId" TEXT NOT NULL REFERENCES "ViolationRecord"("id") ON DELETE CASCADE,
  "storagePath" TEXT NOT NULL UNIQUE,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL CHECK ("size" > 0 AND "size" <= 1048576),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ViolationEvidence_violationId_idx" ON "ViolationEvidence"("violationId");
-- No browser access to evidence metadata. Prisma uses the server database role.
ALTER TABLE "ViolationEvidence" ENABLE ROW LEVEL SECURITY;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('violation-evidence', 'violation-evidence', false, 1048576, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;
-- Verify any pre-existing bucket is PRIVATE before enabling evidence uploads.

CREATE TABLE IF NOT EXISTS "EvidenceCleanup" (
  "storagePath" TEXT PRIMARY KEY,
  "notBefore" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "EvidenceCleanup_notBefore_idx" ON "EvidenceCleanup"("notBefore");
ALTER TABLE "EvidenceCleanup" ENABLE ROW LEVEL SECURITY;
