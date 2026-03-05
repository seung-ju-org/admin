DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectStatus') THEN
    CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "repositoryUrl" TEXT,
    "serviceUrl" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Project_name_idx" ON "Project"("name");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");
CREATE INDEX IF NOT EXISTS "Project_createdAt_idx" ON "Project"("createdAt");
