// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getMonitoringSnapshot: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/monitoring", () => ({ getMonitoringSnapshot: mocks.getMonitoringSnapshot }));

import { GET } from "@/app/api/admin/notifications/route";

describe("GET /api/admin/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    mocks.getServerSession.mockResolvedValueOnce(null);

    const req = { nextUrl: new URL("http://localhost/api/admin/notifications") } as never;
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("maps monitoring alerts to notifications", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } });
    mocks.getMonitoringSnapshot.mockResolvedValueOnce({
      enabled: true,
      generatedAt: "2026-03-05T00:00:00.000Z",
      alerts: [
        { name: "A", severity: "critical", instance: "api-1", value: 1 },
        { name: "B", severity: "warning", instance: "api-2", value: 1 },
      ],
    });

    const req = { nextUrl: new URL("http://localhost/api/admin/notifications?limit=20") } as never;
    const res = await GET(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.unreadCount).toBe(2);
    expect(payload.hasMore).toBe(false);
    expect(payload.nextCursor).toBeNull();
    expect(payload.notifications[0]).toMatchObject({ title: "A", level: "critical" });
    expect(payload.notifications[1]).toMatchObject({ title: "B", level: "warning" });
  });

  it("adds warning notification when monitoring is disabled", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } });
    mocks.getMonitoringSnapshot.mockResolvedValueOnce({
      enabled: false,
      generatedAt: "2026-03-05T00:00:00.000Z",
      alerts: [],
    });

    const req = { nextUrl: new URL("http://localhost/api/admin/notifications?limit=20") } as never;
    const res = await GET(req);
    const payload = await res.json();

    expect(payload.notifications[0]).toMatchObject({
      id: "monitoring-not-configured",
      level: "warning",
    });
  });
});
