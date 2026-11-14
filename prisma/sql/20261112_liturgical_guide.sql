CREATE TABLE "LiturgicalGuide" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LiturgicalGuide_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "LiturgicalGuide" ENABLE ROW LEVEL SECURITY;
