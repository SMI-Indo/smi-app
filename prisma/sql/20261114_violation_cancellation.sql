BEGIN;
ALTER TABLE public."ViolationRecord"
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "cancelledById" TEXT,
  ADD COLUMN "cancelledAt" TIMESTAMP(3);
COMMIT;
