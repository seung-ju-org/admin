"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { extractErrorMessage } from "@/lib/error-message";
import { type Messages } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const UPDATE_PROJECT_MUTATION = gql`
  mutation UpdateProject(
    $projectId: ID!
    $slug: String
    $displayOrder: Int
    $startDate: String
    $endDate: String
    $isOngoing: Boolean
    $isPublished: Boolean
    $links: String
    $translations: [ProjectTranslationInput!]
    $technologyNames: [String!]
  ) {
    updateProject(
      projectId: $projectId
      slug: $slug
      displayOrder: $displayOrder
      startDate: $startDate
      endDate: $endDate
      isOngoing: $isOngoing
      isPublished: $isPublished
      links: $links
      translations: $translations
      technologyNames: $technologyNames
    ) {
      id
    }
  }
`;

type Props = {
  projectId: string;
  initial: {
    slug: string;
    displayOrder: number;
    startDate: string;
    endDate: string;
    isOngoing: boolean;
    isPublished: boolean;
    links: string;
    technologies: string;
    titleKo: string;
    titleEn: string;
    titleJa: string;
    companyKo: string;
    companyEn: string;
    companyJa: string;
    roleKo: string;
    roleEn: string;
    roleJa: string;
    achievementsKo: string;
    achievementsEn: string;
    achievementsJa: string;
  };
  messages: Messages["projectsManager"];
};

function parseTechnologyNames(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function EditProjectForm({ projectId, initial, messages }: Props) {
  const router = useRouter();
  const [updateProject, { loading: isSaving }] = useMutation(UPDATE_PROJECT_MUTATION);
  const [activeLocale, setActiveLocale] = useState<"KO" | "EN" | "JA">("KO");

  const [slug, setSlug] = useState(initial.slug);
  const [displayOrder, setDisplayOrder] = useState(String(initial.displayOrder));
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [isOngoing, setIsOngoing] = useState(initial.isOngoing);
  const [isPublished, setIsPublished] = useState(initial.isPublished);
  const [links, setLinks] = useState(initial.links);
  const [technologies, setTechnologies] = useState(initial.technologies);

  const [titleKo, setTitleKo] = useState(initial.titleKo);
  const [titleEn, setTitleEn] = useState(initial.titleEn);
  const [titleJa, setTitleJa] = useState(initial.titleJa);
  const [companyKo, setCompanyKo] = useState(initial.companyKo);
  const [companyEn, setCompanyEn] = useState(initial.companyEn);
  const [companyJa, setCompanyJa] = useState(initial.companyJa);
  const [roleKo, setRoleKo] = useState(initial.roleKo);
  const [roleEn, setRoleEn] = useState(initial.roleEn);
  const [roleJa, setRoleJa] = useState(initial.roleJa);
  const [achievementsKo, setAchievementsKo] = useState(initial.achievementsKo || "[]");
  const [achievementsEn, setAchievementsEn] = useState(initial.achievementsEn || "[]");
  const [achievementsJa, setAchievementsJa] = useState(initial.achievementsJa || "[]");

  const titleLabel =
    activeLocale === "KO"
      ? messages.titleKo
      : activeLocale === "EN"
        ? messages.titleEn
        : messages.titleJa;
  const companyLabel =
    activeLocale === "KO"
      ? messages.companyKo
      : activeLocale === "EN"
        ? messages.companyEn
        : messages.companyJa;
  const roleLabel =
    activeLocale === "KO"
      ? messages.roleKo
      : activeLocale === "EN"
        ? messages.roleEn
        : messages.roleJa;
  const achievementsLabel =
    activeLocale === "KO"
      ? messages.achievementsKo
      : activeLocale === "EN"
        ? messages.achievementsEn
        : messages.achievementsJa;

  const titleValue = activeLocale === "KO" ? titleKo : activeLocale === "EN" ? titleEn : titleJa;
  const companyValue =
    activeLocale === "KO" ? companyKo : activeLocale === "EN" ? companyEn : companyJa;
  const roleValue = activeLocale === "KO" ? roleKo : activeLocale === "EN" ? roleEn : roleJa;
  const achievementsValue =
    activeLocale === "KO"
      ? achievementsKo
      : activeLocale === "EN"
        ? achievementsEn
        : achievementsJa;

  const setTitleByLocale = (value: string) => {
    if (activeLocale === "KO") setTitleKo(value);
    else if (activeLocale === "EN") setTitleEn(value);
    else setTitleJa(value);
  };
  const setCompanyByLocale = (value: string) => {
    if (activeLocale === "KO") setCompanyKo(value);
    else if (activeLocale === "EN") setCompanyEn(value);
    else setCompanyJa(value);
  };
  const setRoleByLocale = (value: string) => {
    if (activeLocale === "KO") setRoleKo(value);
    else if (activeLocale === "EN") setRoleEn(value);
    else setRoleJa(value);
  };
  const setAchievementsByLocale = (value: string) => {
    if (activeLocale === "KO") setAchievementsKo(value);
    else if (activeLocale === "EN") setAchievementsEn(value);
    else setAchievementsJa(value);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await updateProject({
        variables: {
          projectId,
          slug: slug.trim(),
          displayOrder: Number.parseInt(displayOrder || "0", 10) || 0,
          startDate,
          endDate: endDate.trim() || "",
          isOngoing,
          isPublished,
          links: links.trim() || "",
          translations: [
            {
              locale: "KO",
              title: titleKo.trim(),
              company: companyKo.trim() || null,
              role: roleKo.trim(),
              achievements: achievementsKo.trim() || "[]",
            },
            {
              locale: "EN",
              title: titleEn.trim() || titleKo.trim(),
              company: companyEn.trim() || null,
              role: roleEn.trim() || roleKo.trim(),
              achievements: achievementsEn.trim() || achievementsKo.trim() || "[]",
            },
            {
              locale: "JA",
              title: titleJa.trim() || titleKo.trim(),
              company: companyJa.trim() || null,
              role: roleJa.trim() || roleKo.trim(),
              achievements: achievementsJa.trim() || achievementsKo.trim() || "[]",
            },
          ],
          technologyNames: parseTechnologyNames(technologies),
        },
      });

      toast.success(messages.updateSuccess);
      router.push("/admin/projects");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error) ?? messages.updateError);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{messages.edit}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
          <div className="space-y-2">
            <Label>{messages.slug}</Label>
            <Input onChange={(e) => setSlug(e.target.value)} value={slug} />
          </div>
          <div className="space-y-2">
            <Label>{messages.displayOrder}</Label>
            <Input onChange={(e) => setDisplayOrder(e.target.value)} type="number" value={displayOrder} />
          </div>

          <div className="space-y-2">
            <Label>{messages.startDate}</Label>
            <Input onChange={(e) => setStartDate(e.target.value)} type="date" value={startDate} />
          </div>
          <div className="space-y-2">
            <Label>{messages.endDate}</Label>
            <Input onChange={(e) => setEndDate(e.target.value)} type="date" value={endDate} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{messages.technologies}</Label>
            <Input onChange={(e) => setTechnologies(e.target.value)} value={technologies} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{messages.links}</Label>
            <Input onChange={(e) => setLinks(e.target.value)} value={links} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Language</Label>
            <div className="flex flex-wrap items-center gap-4" role="radiogroup" aria-label="Language">
              {(["KO", "EN", "JA"] as const).map((locale) => (
                <label className="inline-flex cursor-pointer items-center gap-2" key={locale}>
                  <input
                    checked={activeLocale === locale}
                    name="project-locale-edit"
                    onChange={() => setActiveLocale(locale)}
                    type="radio"
                    value={locale}
                  />
                  <span>{locale}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{titleLabel}</Label>
            <Input onChange={(e) => setTitleByLocale(e.target.value)} value={titleValue} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{companyLabel}</Label>
            <Input onChange={(e) => setCompanyByLocale(e.target.value)} value={companyValue} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{roleLabel}</Label>
            <Input onChange={(e) => setRoleByLocale(e.target.value)} value={roleValue} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{achievementsLabel}</Label>
            <Input onChange={(e) => setAchievementsByLocale(e.target.value)} value={achievementsValue} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={isOngoing} onCheckedChange={(v) => setIsOngoing(Boolean(v))} />
            <Label>{messages.isOngoing}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={isPublished} onCheckedChange={(v) => setIsPublished(Boolean(v))} />
            <Label>{messages.isPublished}</Label>
          </div>

          <div className="md:col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="w-full sm:w-auto" onClick={() => router.push("/admin/projects")} type="button" variant="ghost">
              {messages.cancel}
            </Button>
            <Button className="w-full sm:w-auto" disabled={isSaving} type="submit">
              {messages.save}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
