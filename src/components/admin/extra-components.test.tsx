import type { ReactNode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pathname: "/admin/users",
  signOut: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next-auth/react", () => ({
  signOut: mocks.signOut,
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
  },
}));

vi.mock("@/components/admin/monitoring-alerts-table", () => ({
  MonitoringAlertsTable: () => <div>alerts-table</div>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({
    children,
    onClick,
    asChild,
  }: {
    children: ReactNode;
    onClick?: () => void;
    asChild?: boolean;
  }) =>
    asChild ? (
      <div>{children}</div>
    ) : (
      <button onClick={onClick} type="button">
        {children}
      </button>
    ),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AvatarFallback: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  ChartTooltip: () => <div>chart-tooltip</div>,
  ChartTooltipContent: () => <div>tooltip-content</div>,
}));

vi.mock("recharts", () => ({
  AreaChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  CartesianGrid: () => <div>grid</div>,
  XAxis: () => <div>x-axis</div>,
  Area: () => <div>area</div>,
}));

import { NotificationsMenu } from "@/components/admin/notifications-menu";
import { MonitoringOverview } from "@/components/admin/monitoring-overview";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";
import { DashboardMonitoringSummaryCard } from "@/components/admin/dashboard-monitoring-summary-card";
import { DashboardRevenueChart } from "@/components/admin/dashboard-revenue-chart";

let lastEventSource: {
  onmessage: ((event: { data: string }) => void) | null;
  onerror: (() => void) | null;
  close: () => void;
} | null = null;

class FakeEventSource {
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();

  constructor(url: string) {
    void url;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastEventSource = this;
  }
}

describe("admin extra components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    global.EventSource = FakeEventSource as unknown as typeof EventSource;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders notifications and handles stream messages", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        unreadCount: 2,
        notifications: [
          {
            id: "n1",
            title: "Alert",
            description: "desc",
            level: "warning",
            createdAt: "2026-03-05",
          },
        ],
        hasMore: false,
        nextCursor: null,
      }),
    }) as typeof fetch;

    render(
      <NotificationsMenu labels={{ notifications: "Notifications", noNotifications: "None" }} />,
    );

    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByText("Alert")).toBeInTheDocument();
  });

  it("shows error toast when notification stream fails", () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        unreadCount: 0,
        notifications: [],
        hasMore: false,
        nextCursor: null,
      }),
    }) as typeof fetch;

    render(
      <NotificationsMenu labels={{ notifications: "Notifications", noNotifications: "None" }} />,
    );

    lastEventSource?.onerror?.();

    expect(mocks.toastError).toHaveBeenCalledWith("알림 연결이 끊겼습니다. 재연결 중입니다.");
  });

  it("renders monitoring overview and refreshes snapshot", async () => {
    vi.spyOn(global, "setInterval").mockImplementation((callback: TimerHandler) => {
      if (typeof callback === "function") {
        void callback();
      }
      return 1 as unknown as ReturnType<typeof setInterval>;
    });
    vi.spyOn(global, "clearInterval").mockImplementation(() => undefined);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        overallStatus: "healthy",
        alertCount: 1,
        generatedAt: "2026-03-05T00:00:00.000Z",
        grafanaUrl: "https://grafana.example.com",
        alerts: [],
        metrics: {
          availability: 99.5,
          errorRate: 0.2,
          p95Latency: 0.123,
          p99Latency: 0.456,
          cpuUsage: 40,
          memoryUsage: 55,
          queueBacklog: 0,
          restarts30m: 0,
        },
      }),
    }) as typeof fetch;

    render(
      <MonitoringOverview
        locale="en"
        initialSnapshot={{
          enabled: true,
          overallStatus: "unknown",
          alertCount: 0,
          generatedAt: "2026-03-05T00:00:00.000Z",
          grafanaUrl: null,
          alerts: [],
          metrics: {
            availability: null,
            errorRate: null,
            p95Latency: null,
            p99Latency: null,
            cpuUsage: null,
            memoryUsage: null,
            queueBacklog: null,
            restarts30m: null,
          },
        }}
        labels={{
          title: "Monitoring",
          description: "Status",
          grafana: "Grafana",
          unavailable: "Unavailable",
          unavailableDescription: "No data",
          overallStatus: "Overall",
          activeAlerts: "Active alerts",
          lastUpdated: "Last updated",
          healthy: "Healthy",
          warning: "Warning",
          critical: "Critical",
          unknown: "Unknown",
          alertsDescription: "Alerts",
          noAlerts: "No alerts",
          cards: {
            availability: "Availability",
            errorRate: "Error rate",
            p95Latency: "P95",
            p99Latency: "P99",
            cpuUsage: "CPU",
            memoryUsage: "Memory",
            queueBacklog: "Queue",
            restarts: "Restarts",
          },
          alertsTable: {
            alert: "Alert",
            severity: "Severity",
            instance: "Instance",
            value: "Value",
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Healthy")).toBeInTheDocument();
      expect(screen.getByText("alerts-table")).toBeInTheDocument();
    });
  });

  it("renders admin nav and user menu signout", async () => {
    const user = userEvent.setup();

    render(
      <>
        <AdminNav dashboardLabel="Dashboard" usersLabel="Users" createUserLabel="Create" />
        <AdminUserMenu username="admin" accountLabel="Account" logoutLabel="Logout" />
      </>,
    );

    expect(screen.getByText("Users")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Logout/i }));
    expect(mocks.signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  it("renders dashboard monitoring summary and revenue chart", async () => {
    vi.spyOn(global, "setInterval").mockImplementation((callback: TimerHandler) => {
      if (typeof callback === "function") {
        void callback();
      }
      return 1 as unknown as ReturnType<typeof setInterval>;
    });
    vi.spyOn(global, "clearInterval").mockImplementation(() => undefined);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        overallStatus: "warning",
        alertCount: 4,
        generatedAt: "2026-03-05T00:00:00.000Z",
        grafanaUrl: null,
        alerts: [],
        metrics: {
          availability: null,
          errorRate: null,
          p95Latency: null,
          p99Latency: null,
          cpuUsage: null,
          memoryUsage: null,
          queueBacklog: null,
          restarts30m: null,
        },
      }),
    }) as typeof fetch;

    render(
      <>
        <DashboardMonitoringSummaryCard
          locale="en"
          initialSnapshot={{
            enabled: true,
            overallStatus: "healthy",
            alertCount: 0,
            generatedAt: "2026-03-05T00:00:00.000Z",
            grafanaUrl: null,
            alerts: [],
            metrics: {
              availability: null,
              errorRate: null,
              p95Latency: null,
              p99Latency: null,
              cpuUsage: null,
              memoryUsage: null,
              queueBacklog: null,
              restarts30m: null,
            },
          }}
          labels={{
            monitoring: "Monitoring",
            openMonitoring: "Open",
            overallStatus: "Status",
            activeAlerts: "Alerts",
            lastUpdated: "Updated",
            healthy: "Healthy",
            warning: "Warning",
            critical: "Critical",
            unknown: "Unknown",
          }}
        />
        <DashboardRevenueChart />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText("Monitoring")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByTestId("chart-container")).toBeInTheDocument();
      expect(screen.getByTestId("area-chart")).toBeInTheDocument();
    });
  });
});
