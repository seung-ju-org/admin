import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { EditProjectForm } from "@/components/admin/edit-project-form";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

function toInputDate(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  const { id } = await params;

  const project = await prisma.portfolioProject.findFirst({
    where: { id },
    select: {
      id: true,
      slug: true,
      displayOrder: true,
      startDate: true,
      endDate: true,
      isOngoing: true,
      isPublished: true,
      links: true,
      translations: true,
      technologies: {
        select: {
          displayOrder: true,
          technology: {
            select: { name: true },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);
  const messages = getMessages(locale);

  const koTranslation = project.translations.find((item) => item.locale === "KO");
  const enTranslation = project.translations.find((item) => item.locale === "EN");
  const jaTranslation = project.translations.find((item) => item.locale === "JA");

  return (
    <div className="space-y-4 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{messages.projectsManager.edit}</h1>
        <Button asChild className="w-full sm:w-auto" variant="outline">
          <Link href="/admin/projects">{messages.projectsManager.cancel}</Link>
        </Button>
      </div>
      <EditProjectForm
        projectId={project.id}
        initial={{
          slug: project.slug,
          displayOrder: project.displayOrder,
          startDate: toInputDate(project.startDate),
          endDate: toInputDate(project.endDate),
          isOngoing: project.isOngoing,
          isPublished: project.isPublished,
          links: project.links ? JSON.stringify(project.links) : "",
          technologies: project.technologies.map((item) => item.technology.name).join(", "),
          titleKo: koTranslation?.title ?? "",
          titleEn: enTranslation?.title ?? "",
          titleJa: jaTranslation?.title ?? "",
          companyKo: koTranslation?.company ?? "",
          companyEn: enTranslation?.company ?? "",
          companyJa: jaTranslation?.company ?? "",
          roleKo: koTranslation?.role ?? "",
          roleEn: enTranslation?.role ?? "",
          roleJa: jaTranslation?.role ?? "",
          achievementsKo: koTranslation?.achievements ? JSON.stringify(koTranslation.achievements) : "[]",
          achievementsEn: enTranslation?.achievements ? JSON.stringify(enTranslation.achievements) : "[]",
          achievementsJa: jaTranslation?.achievements ? JSON.stringify(jaTranslation.achievements) : "[]",
        }}
        messages={messages.projectsManager}
      />
    </div>
  );
}
