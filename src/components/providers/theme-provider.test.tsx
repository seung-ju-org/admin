import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <div data-testid="next-theme-provider">{children}</div>,
}));

import { ThemeProvider } from "@/components/providers/theme-provider";

describe("ThemeProvider", () => {
  it("wraps children with next-themes provider", () => {
    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("next-theme-provider")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});
