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

const UPDATE_CAREER_MUTATION = gql`
  mutation UpdateCareer(
    $careerId: ID!
    $startDate: String
    $endDate: String
    $isCurrent: Boolean
    $displayOrder: Int
    $isPublished: Boolean
    $translations: [CareerTranslationInput!]
  ) {
    updateCareer(
      careerId: $careerId
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
  careerId: string;
  initial: {
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    displayOrder: number;
    isPublished: boolean;
    companyKo: string;
    companyEn: string;
    companyJa: string;
    positionKo: string;
    positionEn: string;
    positionJa: string;
    descriptionKo: string;
    descriptionEn: string;
    descriptionJa: string;
  };
  messages: Messages["careersManager"];
};

export function EditCareerForm({ careerId, initial, messages }: Props) {
  const router = useRouter();
  const [updateCareer, { loading: isSaving }] = useMutation(UPDATE_CAREER_MUTATION);
  const [activeLocale, setActiveLocale] = useState<"KO" | "EN" | "JA">("KO");

  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [displayOrder, setDisplayOrder] = useState(String(initial.displayOrder));
  const [isCurrent, setIsCurrent] = useState(initial.isCurrent);
  const [isPublished, setIsPublished] = useState(initial.isPublished);

  const [companyKo, setCompanyKo] = useState(initial.companyKo);
  const [companyEn, setCompanyEn] = useState(initial.companyEn);
  const [companyJa, setCompanyJa] = useState(initial.companyJa);
  const [positionKo, setPositionKo] = useState(initial.positionKo);
  const [positionEn, setPositionEn] = useState(initial.positionEn);
  const [positionJa, setPositionJa] = useState(initial.positionJa);
  const [descriptionKo, setDescriptionKo] = useState(initial.descriptionKo);
  const [descriptionEn, setDescriptionEn] = useState(initial.descriptionEn);
  const [descriptionJa, setDescriptionJa] = useState(initial.descriptionJa);

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

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await updateCareer({
        variables: {
          careerId,
          startDate,
          endDate: endDate.trim() || "",
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

      toast.success(messages.updateSuccess);
      router.push("/admin/careers");
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
                    name="career-locale-edit"
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
            <Input onChange={(event) => setCompanyByLocale(event.target.value)} value={companyValue} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{positionLabel}</Label>
            <Input onChange={(event) => setPositionByLocale(event.target.value)} value={positionValue} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{descriptionLabel}</Label>
            <Input onChange={(event) => setDescriptionByLocale(event.target.value)} value={descriptionValue} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={isCurrent} id="edit-career-current" onCheckedChange={(v) => setIsCurrent(Boolean(v))} />
            <Label htmlFor="edit-career-current">{messages.isCurrent}</Label>
          </div>
          <div className="flex items-center gap-2 md:col-start-1">
            <Checkbox checked={isPublished} id="edit-career-published" onCheckedChange={(v) => setIsPublished(Boolean(v))} />
            <Label htmlFor="edit-career-published">{messages.isPublished}</Label>
          </div>

          <div className="md:col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="w-full sm:w-auto" onClick={() => router.push("/admin/careers")} type="button" variant="ghost">
              {messages.backToList}
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
