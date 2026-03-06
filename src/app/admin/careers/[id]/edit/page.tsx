import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { EditCareerForm } from "@/components/admin/edit-career-form";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

type EditCareerRecord = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  isOngoing: boolean;
  displayOrder: number;
  translations: Array<{
    locale: "KO" | "EN" | "JA";
    company: string;
    position: string;
    overview: string | null;
  }>;
};

function toInputDate(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function EditCareerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  const { id } = await params;

  const baseRows = await prisma.$queryRaw<
    Array<{
      id: string;
      startDate: Date;
      endDate: Date | null;
      isOngoing: boolean;
      displayOrder: number;
    }>
  >(
    Prisma.sql`
      SELECT
        c."id",
        c."startDate",
        c."endDate",
        COALESCE(
          NULLIF(to_jsonb(c)->>'isOngoing', '')::boolean,
          NULLIF(to_jsonb(c)->>'isCurrent', '')::boolean,
          false
        ) AS "isOngoing",
        c."displayOrder"
      FROM "Career" c
      WHERE c."id" = ${id}::uuid
      LIMIT 1
    `,
  );

  let career: EditCareerRecord | null = null;
  if (baseRows.length > 0) {
    const translationRows = await prisma.$queryRaw<
      Array<{
        locale: "KO" | "EN" | "JA";
        company: string;
        position: string;
        overview: string | null;
      }>
    >(
      Prisma.sql`
        SELECT
          t."locale"::text AS "locale",
          t."company",
          t."position",
          COALESCE(to_jsonb(t)->>'overview', to_jsonb(t)->>'description') AS "overview"
        FROM "CareerTranslation" t
        WHERE t."careerId" = ${id}::uuid
        ORDER BY t."id" ASC
      `,
    );

    career = {
      ...baseRows[0],
      translations: translationRows,
    };
  }

  if (!career) {
    notFound();
  }

  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);
  const messages = getMessages(locale);

  const translationKo = career.translations.find((tr) => tr.locale === "KO");
  const translationEn = career.translations.find((tr) => tr.locale === "EN");
  const translationJa = career.translations.find((tr) => tr.locale === "JA");

  return (
    <div className="space-y-4 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{messages.careersPage.editTitle}</h1>
        <Button asChild className="w-full sm:w-auto" variant="outline">
          <Link href="/admin/careers">{messages.careersManager.backToList}</Link>
        </Button>
      </div>
      <EditCareerForm
        careerId={career.id}
        initial={{
          startDate: toInputDate(career.startDate),
          endDate: toInputDate(career.endDate),
          isCurrent: career.isOngoing,
          displayOrder: career.displayOrder,
          isPublished: true,
          companyKo: translationKo?.company ?? "",
          companyEn: translationEn?.company ?? translationKo?.company ?? "",
          companyJa: translationJa?.company ?? translationKo?.company ?? "",
          positionKo: translationKo?.position ?? "",
          positionEn: translationEn?.position ?? translationKo?.position ?? "",
          positionJa: translationJa?.position ?? translationKo?.position ?? "",
          descriptionKo: translationKo?.overview ?? "",
          descriptionEn: translationEn?.overview ?? translationKo?.overview ?? "",
          descriptionJa: translationJa?.overview ?? translationKo?.overview ?? "",
        }}
        messages={messages.careersManager}
      />
    </div>
  );
}
