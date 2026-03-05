// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getMonitoringSnapshot: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/monitoring", () => ({ getMonitoringSnapshot: mocks.getMonitoringSnapshot }));

import { GET } from "@/app/api/admin/monitoring/summary/route";

describe("GET /api/admin/monitoring/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for non-admin users", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "USER" } });

    const res = await GET();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns snapshot for admin users", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } });
    mocks.getMonitoringSnapshot.mockResolvedValueOnce({
      enabled: true,
      generatedAt: "2026-03-05T00:00:00.000Z",
      grafanaUrl: "https://grafana.seung-ju.com",
      overallStatus: "healthy",
      alertCount: 0,
      metrics: {
        availability: 99,
        errorRate: 0,
        p95Latency: 0.2,
        p99Latency: 0.3,
        cpuUsage: 30,
        memoryUsage: 40,
        queueBacklog: 0,
        restarts30m: 0,
      },
      alerts: [],
    });

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ overallStatus: "healthy" });
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
