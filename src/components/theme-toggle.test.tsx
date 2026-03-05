import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setTheme: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: mocks.setTheme }),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} type="button">
      {children}
    </button>
  ),
}));

import { ThemeToggle } from "@/components/theme-toggle";

describe("ThemeToggle", () => {
  it("changes theme when each menu item is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ThemeToggle
        label="Theme"
        names={{ light: "Light", system: "System", dark: "Dark" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Light/i }));
    await user.click(screen.getByRole("button", { name: /System/i }));
    await user.click(screen.getByRole("button", { name: /Dark/i }));

    expect(mocks.setTheme).toHaveBeenNthCalledWith(1, "light");
    expect(mocks.setTheme).toHaveBeenNthCalledWith(2, "system");
    expect(mocks.setTheme).toHaveBeenNthCalledWith(3, "dark");
  });
});
