import { describe, expect, it } from "vitest";

import {
  detectLocaleFromAcceptLanguage,
  detectLocaleFromCountry,
  detectPreferredLocale,
} from "@/lib/locale-detection";

describe("locale-detection", () => {
  it("detects locale from country", () => {
    expect(detectLocaleFromCountry("KR")).toBe("ko");
    expect(detectLocaleFromCountry("jp")).toBe("ja");
    expect(detectLocaleFromCountry("US")).toBe("en");
    expect(detectLocaleFromCountry("")).toBeNull();
    expect(detectLocaleFromCountry(null)).toBeNull();
  });

  it("detects locale from accept-language with q-value priority", () => {
    const header = "en-US;q=0.7, ko-KR;q=0.9, ja-JP;q=0.8";
    expect(detectLocaleFromAcceptLanguage(header)).toBe("ko");
  });

  it("returns null when accept-language has no supported locale", () => {
    expect(detectLocaleFromAcceptLanguage("de-DE,de;q=0.9")).toBeNull();
  });

  it("prefers country over accept-language", () => {
    expect(
      detectPreferredLocale({
        country: "JP",
        acceptLanguage: "ko-KR,ko;q=0.9",
      }),
    ).toBe("ja");
  });

  it("falls back to default locale when no hint exists", () => {
    expect(detectPreferredLocale({ country: null, acceptLanguage: null })).toBe("ko");
  });
});
