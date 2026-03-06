import { describe, expect, it } from "vitest";

import {
  buildNotifications,
  buildNotificationsFingerprint,
  paginateNotifications,
} from "@/lib/admin-notifications";

describe("buildNotifications", () => {
  it("creates warning when monitoring is not configured", () => {
    const result = buildNotifications({
      enabled: false,
      generatedAt: "2026-03-05T00:00:00.000Z",
      grafanaUrl: null,
      overallStatus: "unknown",
      alertCount: 0,
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
      alerts: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "monitoring-not-configured",
      level: "warning",
    });
  });

  it("maps alert severities and truncates to 20", () => {
    const alerts = Array.from({ length: 25 }).map((_, index) => ({
      name: `alert-${index}`,
      instance: `instance-${index}`,
      severity: index % 2 === 0 ? "critical" : "warning",
      value: index + 1,
    }));

    const result = buildNotifications({
      enabled: true,
      generatedAt: "2026-03-05T00:00:00.000Z",
      grafanaUrl: null,
      overallStatus: "healthy",
      alertCount: alerts.length,
      metrics: {
        availability: 99.9,
        errorRate: 0.1,
        p95Latency: 0.1,
        p99Latency: 0.2,
        cpuUsage: 30,
        memoryUsage: 40,
        queueBacklog: 0,
        restarts30m: 0,
      },
      alerts,
    });

    expect(result).toHaveLength(25);
    expect(result[0].level).toBe("critical");
    expect(result[1].level).toBe("warning");
  });

  it("paginates notifications with cursor", () => {
    const notifications = Array.from({ length: 3 }).map((_, index) => ({
      id: `n${index}`,
      title: `t${index}`,
      description: `d${index}`,
      level: "info" as const,
      createdAt: "2026-03-05T00:00:00.000Z",
    }));

    const page1 = paginateNotifications(notifications, null, 2);
    const page2 = paginateNotifications(notifications, page1.nextCursor, 2);

    expect(page1.items).toHaveLength(2);
    expect(page1.hasMore).toBe(true);
    expect(page2.items).toHaveLength(1);
    expect(page2.hasMore).toBe(false);
  });

  it("builds stable fingerprint string", () => {
    const fingerprint = buildNotificationsFingerprint([
      {
        id: "n1",
        title: "t1",
        description: "d1",
        level: "info",
        createdAt: "2026-03-05T00:00:00.000Z",
      },
    ]);

    expect(fingerprint).toBe("n1:2026-03-05T00:00:00.000Z");
  });
});
