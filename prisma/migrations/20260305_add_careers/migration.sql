CREATE TABLE IF NOT EXISTS "portfolio"."Career" (
    "id" UUID NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Career_company_idx" ON "portfolio"."Career"("company");
CREATE INDEX IF NOT EXISTS "Career_displayOrder_idx" ON "portfolio"."Career"("displayOrder");
CREATE INDEX IF NOT EXISTS "Career_startDate_idx" ON "portfolio"."Career"("startDate");
