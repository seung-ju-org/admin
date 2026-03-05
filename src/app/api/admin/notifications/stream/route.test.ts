// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getMonitoringSnapshot: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: { test: true },
}));

vi.mock("@/lib/monitoring", () => ({
  getMonitoringSnapshot: mocks.getMonitoringSnapshot,
}));

import { GET } from "@/app/api/admin/notifications/stream/route";

describe("notifications stream route", () => {
  it("returns 401 for unauthenticated user", async () => {
    mocks.getServerSession.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns SSE stream for admin session", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } });
    mocks.getMonitoringSnapshot.mockResolvedValueOnce({
      enabled: true,
      generatedAt: "2026-01-01T00:00:00.000Z",
      alerts: [{ name: "HighErrorRate", severity: "warning", instance: "api-1" }],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    const chunk = await reader?.read();
    const data = new TextDecoder().decode(chunk?.value);

    expect(data).toContain("data:");
    expect(data).toContain('"unreadCount":1');
    expect(data).toContain('"hasNew":false');

    await reader?.cancel();
  });
});
