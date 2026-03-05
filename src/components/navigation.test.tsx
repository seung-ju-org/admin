import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  useSidebar: vi.fn(() => ({ isMobile: false })),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("next-auth/react", () => ({
  signOut: mocks.signOut,
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AvatarFallback: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  AvatarImage: ({ alt }: { alt: string }) => <img alt={alt} />, 
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, asChild }: { children: ReactNode; onClick?: () => void; asChild?: boolean }) =>
    asChild ? <div>{children}</div> : <button onClick={onClick} type="button">{children}</button>,
  DropdownMenuLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarGroup: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  SidebarMenuAction: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  SidebarTrigger: () => <button type="button">trigger</button>,
  useSidebar: () => mocks.useSidebar(),
}));

vi.mock("@/components/admin/notifications-menu", () => ({
  NotificationsMenu: () => <div>notifications-menu</div>,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div>theme-toggle</div>,
}));

vi.mock("@/components/language-switcher", () => ({
  LanguageSwitcher: () => <div>language-switcher</div>,
}));

import { IconFolder } from "@tabler/icons-react";
import { NavMain } from "@/components/nav-main";
import { NavDocuments } from "@/components/nav-documents";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { SiteHeader } from "@/components/site-header";
import { SectionCards } from "@/components/section-cards";

describe("navigation components", () => {
  it("renders main/document/secondary navigation", () => {
    render(
      <>
        <NavMain items={[{ title: "Dashboard", url: "/admin", icon: IconFolder }]} />
        <NavDocuments items={[{ name: "Doc 1", url: "/doc/1", icon: IconFolder }]} />
        <NavSecondary items={[{ title: "Help", url: "/help", icon: IconFolder }]} />
      </>,
    );

    expect(screen.getByText("Quick Create")).toBeInTheDocument();
    expect(screen.getByText("Doc 1")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
  });

  it("calls signOut in NavUser", async () => {
    const user = userEvent.setup();

    render(
      <NavUser
        user={{ name: "Admin User", email: "admin@seung-ju.com" }}
        accountLabel="Account"
        logoutLabel="Logout"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Logout/i }));

    expect(mocks.signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  it("renders site header and cards", () => {
    render(
      <>
        <SiteHeader
          title="Admin"
          languageLabel="Language"
          themeLabel="Theme"
          locale="en"
          notifications={{ notifications: "Notifications", noNotifications: "None", viewMonitoring: "Open" }}
        />
        <SectionCards />
      </>,
    );

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("notifications-menu")).toBeInTheDocument();
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("Growth Rate")).toBeInTheDocument();
  });
});
