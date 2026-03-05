import type { ReactNode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pathname: "/admin/monitoring",
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
  },
}));

vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: ReactNode }) => <aside>{children}</aside>,
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarSeparator: () => <hr />,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div>theme-toggle</div>,
}));

vi.mock("@/components/language-switcher", () => ({
  LanguageSwitcher: () => <div>language-switcher</div>,
}));

vi.mock("@/components/nav-user", () => ({
  NavUser: () => <div>nav-user</div>,
}));

import { AppSidebar } from "@/components/app-sidebar";

const labels = {
  dashboard: "Dashboard",
  users: "Users",
  projects: "Projects",
  careers: "Careers",
  monitoring: "Monitoring",
  account: "Account",
  logout: "Logout",
  language: "Language",
  theme: "Theme",
};

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ alertCount: 3 }),
    }) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders menu and monitoring badge", async () => {
    render(
      <AppSidebar
        locale="en"
        user={{ name: "Admin", email: "admin@seung-ju.com" }}
        labels={labels}
      />,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("shows monitoring toast on summary error", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as typeof fetch;

    render(
      <AppSidebar
        locale="en"
        user={{ name: "Admin", email: "admin@seung-ju.com" }}
        labels={labels}
      />,
    );

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("모니터링 요약을 불러오지 못했습니다.");
    });
  });
});
