BEGIN;
ALTER TABLE public."Event" ADD COLUMN "registrationFields" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public."EventRegistration"
  ALTER COLUMN "phone" DROP NOT NULL,
  ADD COLUMN "customAnswers" JSONB NOT NULL DEFAULT '[]';
COMMIT;
