"use client";

import { useRouter } from "next/navigation";

import type { Locale } from "@/lib/i18n";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  locale: Locale;
  label: string;
  names: Record<Locale, string>;
};

export function LanguageSwitcher({ locale, label, names }: Props) {
  const router = useRouter();

  const handleChange = (value: string) => {
    document.cookie = `locale=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select onValueChange={handleChange} value={locale}>
        <SelectTrigger className="h-8 w-[96px] sm:w-[120px]">
          <SelectValue placeholder={names[locale]} />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LOCALES.map((item) => (
            <SelectItem key={item} value={item}>
              {names[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
