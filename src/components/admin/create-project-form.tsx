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

const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject(
    $slug: String!
    $displayOrder: Int!
    $startDate: String!
    $endDate: String
    $isOngoing: Boolean!
    $isPublished: Boolean!
    $links: String
    $translations: [ProjectTranslationInput!]!
    $technologyNames: [String!]
  ) {
    createProject(
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
  messages: Messages["projectsManager"];
};

function parseTechnologyNames(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function CreateProjectForm({ messages }: Props) {
  const router = useRouter();
  const [createProject, { loading: isCreating }] = useMutation(CREATE_PROJECT_MUTATION);
  const [activeLocale, setActiveLocale] = useState<"KO" | "EN" | "JA">("KO");

  const [slug, setSlug] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [links, setLinks] = useState("");
  const [technologies, setTechnologies] = useState("");

  const [titleKo, setTitleKo] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [companyKo, setCompanyKo] = useState("");
  const [companyEn, setCompanyEn] = useState("");
  const [companyJa, setCompanyJa] = useState("");
  const [roleKo, setRoleKo] = useState("");
  const [roleEn, setRoleEn] = useState("");
  const [roleJa, setRoleJa] = useState("");
  const [achievementsKo, setAchievementsKo] = useState("[]");
  const [achievementsEn, setAchievementsEn] = useState("[]");
  const [achievementsJa, setAchievementsJa] = useState("[]");

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

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!slug.trim() || !startDate.trim() || !titleKo.trim() || !roleKo.trim()) {
      return;
    }

    try {
      await createProject({
        variables: {
          slug: slug.trim(),
          displayOrder: Number.parseInt(displayOrder || "0", 10) || 0,
          startDate,
          endDate: endDate.trim() || null,
          isOngoing,
          isPublished,
          links: links.trim() || null,
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
              title: (titleEn.trim() || titleKo.trim()),
              company: companyEn.trim() || null,
              role: (roleEn.trim() || roleKo.trim()),
              achievements: achievementsEn.trim() || achievementsKo.trim() || "[]",
            },
            {
              locale: "JA",
              title: (titleJa.trim() || titleKo.trim()),
              company: companyJa.trim() || null,
              role: (roleJa.trim() || roleKo.trim()),
              achievements: achievementsJa.trim() || achievementsKo.trim() || "[]",
            },
          ],
          technologyNames: parseTechnologyNames(technologies),
        },
      });

      toast.success(messages.createSuccess);
      router.push("/admin/projects");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error) ?? messages.createError);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{messages.create}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <div className="space-y-2">
            <Label htmlFor="new-project-slug">{messages.slug}</Label>
            <Input id="new-project-slug" onChange={(e) => setSlug(e.target.value)} placeholder={messages.slugPlaceholder} value={slug} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-project-order">{messages.displayOrder}</Label>
            <Input id="new-project-order" onChange={(e) => setDisplayOrder(e.target.value)} type="number" value={displayOrder} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-project-start-date">{messages.startDate}</Label>
            <Input id="new-project-start-date" onChange={(e) => setStartDate(e.target.value)} type="date" value={startDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-project-end-date">{messages.endDate}</Label>
            <Input id="new-project-end-date" onChange={(e) => setEndDate(e.target.value)} type="date" value={endDate} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="new-project-tech">{messages.technologies}</Label>
            <Input id="new-project-tech" onChange={(e) => setTechnologies(e.target.value)} placeholder={messages.technologiesPlaceholder} value={technologies} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="new-project-links">{messages.links}</Label>
            <Input id="new-project-links" onChange={(e) => setLinks(e.target.value)} placeholder={messages.linksPlaceholder} value={links} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Language</Label>
            <div className="flex flex-wrap items-center gap-4" role="radiogroup" aria-label="Language">
              {(["KO", "EN", "JA"] as const).map((locale) => (
                <label className="inline-flex cursor-pointer items-center gap-2" key={locale}>
                  <input
                    checked={activeLocale === locale}
                    name="project-locale-create"
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
            <Input onChange={(e) => setTitleByLocale(e.target.value)} placeholder={messages.titlePlaceholder} value={titleValue} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{companyLabel}</Label>
            <Input onChange={(e) => setCompanyByLocale(e.target.value)} placeholder={messages.companyPlaceholder} value={companyValue} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{roleLabel}</Label>
            <Input onChange={(e) => setRoleByLocale(e.target.value)} placeholder={messages.rolePlaceholder} value={roleValue} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{achievementsLabel}</Label>
            <Input onChange={(e) => setAchievementsByLocale(e.target.value)} placeholder={messages.achievementsPlaceholder} value={achievementsValue} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={isOngoing} id="new-project-ongoing" onCheckedChange={(v) => setIsOngoing(Boolean(v))} />
            <Label htmlFor="new-project-ongoing">{messages.isOngoing}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={isPublished} id="new-project-published" onCheckedChange={(v) => setIsPublished(Boolean(v))} />
            <Label htmlFor="new-project-published">{messages.isPublished}</Label>
          </div>

          <div className="md:col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="w-full sm:w-auto" onClick={() => router.push("/admin/projects")} type="button" variant="ghost">
              {messages.cancel}
            </Button>
            <Button className="w-full sm:w-auto" disabled={isCreating} type="submit">
              {messages.create}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
