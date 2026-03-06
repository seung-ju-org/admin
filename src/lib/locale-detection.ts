import { type Locale, getLocale } from "@/lib/i18n";

const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  KR: "ko",
  JP: "ja",
};

const ACCEPT_LANGUAGE_LOCALE_MAP: Array<{ prefix: string; locale: Locale }> = [
  { prefix: "ko", locale: "ko" },
  { prefix: "ja", locale: "ja" },
  { prefix: "en", locale: "en" },
];

export function detectLocaleFromCountry(country?: string | null): Locale | null {
  if (!country) return null;
  const normalizedCountry = country.trim().toUpperCase();
  if (!normalizedCountry) return null;
  return COUNTRY_LOCALE_MAP[normalizedCountry] ?? "en";
}

export function detectLocaleFromAcceptLanguage(acceptLanguage?: string | null): Locale | null {
  if (!acceptLanguage) return null;

  const entries = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [rawTag, ...rawParams] = entry.trim().split(";");
      const tag = rawTag.trim().toLowerCase();

      let q = 1;
      for (const param of rawParams) {
        const [key, value] = param.trim().split("=");
        if (key === "q" && value) {
          const parsedQ = Number(value);
          if (!Number.isNaN(parsedQ)) q = parsedQ;
        }
      }

      return { tag, q, index };
    })
    .filter((entry) => Boolean(entry.tag))
    .sort((left, right) => {
      if (left.q === right.q) return left.index - right.index;
      return right.q - left.q;
    });

  for (const { tag } of entries) {
    for (const supported of ACCEPT_LANGUAGE_LOCALE_MAP) {
      if (tag === supported.prefix || tag.startsWith(`${supported.prefix}-`)) {
        return supported.locale;
      }
    }
  }

  return null;
}

type DetectPreferredLocaleInput = {
  country?: string | null;
  acceptLanguage?: string | null;
};

export function detectPreferredLocale({ country, acceptLanguage }: DetectPreferredLocaleInput): Locale {
  return (
    detectLocaleFromCountry(country) ??
    detectLocaleFromAcceptLanguage(acceptLanguage) ??
    getLocale(null)
  );
}
