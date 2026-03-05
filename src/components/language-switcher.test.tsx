import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: { children: ReactNode; onValueChange?: (value: string) => void; value: string }) => (
    <div data-value={value}>
      {children}
      <button onClick={() => onValueChange?.("ko")} type="button">
        set-ko
      </button>
    </div>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { LanguageSwitcher } from "@/components/language-switcher";

describe("LanguageSwitcher", () => {
  it("updates cookie and refreshes router", async () => {
    const user = userEvent.setup();

    render(
      <LanguageSwitcher
        locale="en"
        label="Language"
        names={{ en: "English", ko: "한국어", ja: "日本語" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "set-ko" }));

    expect(document.cookie).toContain("locale=ko");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});
