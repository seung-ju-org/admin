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

const CREATE_CAREER_MUTATION = gql`
  mutation CreateCareer(
    $startDate: String!
    $endDate: String
    $isCurrent: Boolean!
    $displayOrder: Int!
    $isPublished: Boolean!
    $translations: [CareerTranslationInput!]!
  ) {
    createCareer(
      startDate: $startDate
      endDate: $endDate
      isCurrent: $isCurrent
      displayOrder: $displayOrder
      isPublished: $isPublished
      translations: $translations
    ) {
      id
    }
  }
`;

type Props = {
  messages: Messages["careersManager"];
};

export function CreateCareerForm({ messages }: Props) {
  const router = useRouter();
  const [createCareer, { loading: isCreating }] = useMutation(CREATE_CAREER_MUTATION);
  const [activeLocale, setActiveLocale] = useState<"KO" | "EN" | "JA">("KO");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isCurrent, setIsCurrent] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const [companyKo, setCompanyKo] = useState("");
  const [companyEn, setCompanyEn] = useState("");
  const [companyJa, setCompanyJa] = useState("");
  const [positionKo, setPositionKo] = useState("");
  const [positionEn, setPositionEn] = useState("");
  const [positionJa, setPositionJa] = useState("");
  const [descriptionKo, setDescriptionKo] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionJa, setDescriptionJa] = useState("");

  const companyLabel =
    activeLocale === "KO"
      ? messages.companyKo
      : activeLocale === "EN"
        ? messages.companyEn
        : messages.companyJa;
  const positionLabel =
    activeLocale === "KO"
      ? messages.positionKo
      : activeLocale === "EN"
        ? messages.positionEn
        : messages.positionJa;
  const descriptionLabel =
    activeLocale === "KO"
      ? messages.descriptionKo
      : activeLocale === "EN"
        ? messages.descriptionEn
        : messages.descriptionJa;

  const companyValue =
    activeLocale === "KO" ? companyKo : activeLocale === "EN" ? companyEn : companyJa;
  const positionValue =
    activeLocale === "KO" ? positionKo : activeLocale === "EN" ? positionEn : positionJa;
  const descriptionValue =
    activeLocale === "KO"
      ? descriptionKo
      : activeLocale === "EN"
        ? descriptionEn
        : descriptionJa;

  const setCompanyByLocale = (value: string) => {
    if (activeLocale === "KO") setCompanyKo(value);
    else if (activeLocale === "EN") setCompanyEn(value);
    else setCompanyJa(value);
  };
  const setPositionByLocale = (value: string) => {
    if (activeLocale === "KO") setPositionKo(value);
    else if (activeLocale === "EN") setPositionEn(value);
    else setPositionJa(value);
  };
  const setDescriptionByLocale = (value: string) => {
    if (activeLocale === "KO") setDescriptionKo(value);
    else if (activeLocale === "EN") setDescriptionEn(value);
    else setDescriptionJa(value);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!startDate.trim() || !companyKo.trim() || !positionKo.trim()) {
      return;
    }

    try {
      await createCareer({
        variables: {
          startDate,
          endDate: endDate.trim() || null,
          isCurrent,
          displayOrder: Number.parseInt(displayOrder || "0", 10) || 0,
          isPublished,
          translations: [
            {
              locale: "KO",
              company: companyKo.trim(),
              position: positionKo.trim(),
              description: descriptionKo.trim() || null,
            },
            {
              locale: "EN",
              company: companyEn.trim() || companyKo.trim(),
              position: positionEn.trim() || positionKo.trim(),
              description: descriptionEn.trim() || descriptionKo.trim() || null,
            },
            {
              locale: "JA",
              company: companyJa.trim() || companyKo.trim(),
              position: positionJa.trim() || positionKo.trim(),
              description: descriptionJa.trim() || descriptionKo.trim() || null,
            },
          ],
        },
      });

      toast.success(messages.createSuccess);
      router.push("/admin/careers");
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
            <Label>{messages.displayOrder}</Label>
            <Input
              onChange={(event) => setDisplayOrder(event.target.value)}
              type="number"
              value={displayOrder}
            />
          </div>

          <div className="space-y-2">
            <Label>{messages.startDate}</Label>
            <Input onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
          </div>
          <div className="space-y-2">
            <Label>{messages.endDate}</Label>
            <Input onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Language</Label>
            <div aria-label="Language" className="flex flex-wrap items-center gap-4" role="radiogroup">
              {(["KO", "EN", "JA"] as const).map((locale) => (
                <label className="inline-flex cursor-pointer items-center gap-2" key={locale}>
                  <input
                    checked={activeLocale === locale}
                    name="career-locale-create"
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
            <Label>{companyLabel}</Label>
            <Input
              onChange={(event) => setCompanyByLocale(event.target.value)}
              placeholder={messages.companyPlaceholder}
              value={companyValue}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{positionLabel}</Label>
            <Input
              onChange={(event) => setPositionByLocale(event.target.value)}
              placeholder={messages.positionPlaceholder}
              value={positionValue}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{descriptionLabel}</Label>
            <Input
              onChange={(event) => setDescriptionByLocale(event.target.value)}
              placeholder={messages.descriptionPlaceholder}
              value={descriptionValue}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={isCurrent} id="new-career-current" onCheckedChange={(v) => setIsCurrent(Boolean(v))} />
            <Label htmlFor="new-career-current">{messages.isCurrent}</Label>
          </div>
          <div className="flex items-center gap-2 md:col-start-1">
            <Checkbox checked={isPublished} id="new-career-published" onCheckedChange={(v) => setIsPublished(Boolean(v))} />
            <Label htmlFor="new-career-published">{messages.isPublished}</Label>
          </div>

          <div className="md:col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="w-full sm:w-auto" onClick={() => router.push("/admin/careers")} type="button" variant="ghost">
              {messages.backToList}
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
