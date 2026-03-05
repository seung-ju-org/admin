CREATE TABLE IF NOT EXISTS "portfolio"."CareerTranslation" (
    "id" INTEGER NOT NULL,
    "careerId" UUID NOT NULL,
    "locale" "portfolio"."PortfolioLocale" NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerTranslation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CareerTranslation_careerId_fkey" FOREIGN KEY ("careerId")
      REFERENCES "portfolio"."Career"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CareerTranslation_careerId_locale_key"
  ON "portfolio"."CareerTranslation"("careerId", "locale");

CREATE INDEX IF NOT EXISTS "CareerTranslation_locale_idx"
  ON "portfolio"."CareerTranslation"("locale");

INSERT INTO "portfolio"."CareerTranslation" (
  "id", "careerId", "locale", "company", "position", "description", "createdAt", "updatedAt"
)
SELECT
  ROW_NUMBER() OVER (ORDER BY c."createdAt", c."id")
  + COALESCE((SELECT MAX(t."id") FROM "portfolio"."CareerTranslation" t), 0),
  c."id",
  'KO'::"portfolio"."PortfolioLocale",
  c."company",
  c."position",
  c."description",
  c."createdAt",
  c."updatedAt"
FROM "portfolio"."Career" c
WHERE NOT EXISTS (
  SELECT 1
  FROM "portfolio"."CareerTranslation" t
  WHERE t."careerId" = c."id" AND t."locale" = 'KO'::"portfolio"."PortfolioLocale"
);
