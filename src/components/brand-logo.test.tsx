import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasMark: false,
  hasWordmark: false,
}));

vi.mock("node:fs", () => ({
  default: {
    existsSync: (filePath: string) =>
      (mocks.hasMark && filePath.endsWith("logo-mark.png")) ||
      (mocks.hasWordmark && filePath.endsWith("logo-wordmark.png")),
  },
  existsSync: (filePath: string) =>
    (mocks.hasMark && filePath.endsWith("logo-mark.png")) ||
    (mocks.hasWordmark && filePath.endsWith("logo-wordmark.png")),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.hasMark = false;
  mocks.hasWordmark = false;
});

describe("BrandLogo", () => {
  it("renders fallback text when logo assets do not exist", async () => {
    const { BrandLogo } = await import("@/components/brand-logo");

    render(<BrandLogo />);

    expect(screen.getByText("SJ")).toBeInTheDocument();
    expect(screen.getByText("Seung Ju")).toBeInTheDocument();
  });

  it("renders image assets when files exist", async () => {
    mocks.hasMark = true;
    mocks.hasWordmark = true;

    const { BrandLogo } = await import("@/components/brand-logo");

    render(<BrandLogo />);

    expect(screen.getByAltText("Seung Ju mark")).toHaveAttribute("src", "/logo-mark.png");
    expect(screen.getByAltText("Seung Ju")).toHaveAttribute("src", "/logo-wordmark.png");
  });
});
