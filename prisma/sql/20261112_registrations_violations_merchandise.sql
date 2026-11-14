BEGIN;

-- AlterTable
ALTER TABLE "ViolationRecord" ADD COLUMN     "followUp" TEXT,
ADD COLUMN     "severity" TEXT NOT NULL DEFAULT 'RINGAN',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "registrationCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "registrationDeadline" TIMESTAMP(3),
ADD COLUMN     "registrationSlug" TEXT,
ADD COLUMN     "registrationTerms" TEXT;

-- CreateTable
CREATE TABLE "MerchandiseVariant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MerchandiseVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchandiseOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchandiseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchandiseOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "MerchandiseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "community" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MerchandiseOrder_userId_createdAt_idx" ON "MerchandiseOrder"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_email_key" ON "EventRegistration"("eventId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_phone_key" ON "EventRegistration"("eventId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Event_registrationSlug_key" ON "Event"("registrationSlug");

-- AddForeignKey
ALTER TABLE "MerchandiseOrder" ADD CONSTRAINT "MerchandiseOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchandiseOrderItem" ADD CONSTRAINT "MerchandiseOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MerchandiseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchandiseOrderItem" ADD CONSTRAINT "MerchandiseOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "MerchandiseVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "EventRegistration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MerchandiseVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MerchandiseOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MerchandiseOrderItem" ENABLE ROW LEVEL SECURITY;

COMMIT;
