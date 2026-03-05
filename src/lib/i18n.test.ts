import { describe, expect, it } from "vitest";

import { getLocale, getMessages, SUPPORTED_LOCALES } from "@/lib/i18n";

describe("i18n", () => {
  it("returns default locale for unknown locale", () => {
    expect(getLocale("fr")).toBe("ko");
    expect(getLocale()).toBe("ko");
  });

  it("accepts supported locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(getLocale(locale)).toBe(locale);
    }
  });

  it("returns locale-specific messages", () => {
    const en = getMessages("en");
    const ko = getMessages("ko");

    expect(en.common.dashboard).toBe("Dashboard");
    expect(ko.common.dashboard).toBe("대시보드");
  });
});
