import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMonitoringSnapshot } from "@/lib/monitoring";

describe("getMonitoringSnapshot", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.PROMETHEUS_BASE_URL = "https://prometheus.example.com";
    process.env.GRAFANA_DASHBOARD_URL = "https://grafana.example.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("builds a healthy snapshot when metrics are in normal range", async () => {
    const success = (value: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: "success", data: { result: [{ metric: {}, value: [0, value] }] } }),
      } as Response);

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockImplementationOnce(() => success("99.9"))
      .mockImplementationOnce(() => success("0.2"))
      .mockImplementationOnce(() => success("0.5"))
      .mockImplementationOnce(() => success("0.8"))
      .mockImplementationOnce(() => success("20"))
      .mockImplementationOnce(() => success("30"))
      .mockImplementationOnce(() => success("5"))
      .mockImplementationOnce(() => success("0"))
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "success", data: { result: [] } }),
        } as Response),
      );

    const snapshot = await getMonitoringSnapshot();

    expect(fetchMock).toHaveBeenCalledTimes(9);
    expect(snapshot.enabled).toBe(true);
    expect(snapshot.grafanaUrl).toBe("https://grafana.example.com");
    expect(snapshot.overallStatus).toBe("healthy");
    expect(snapshot.alertCount).toBe(0);
    expect(snapshot.metrics.errorRate).toBe(0.2);
  });

  it("returns critical status when firing alerts exist", async () => {
    const empty = Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: "success", data: { result: [] } }),
    } as Response);

    const alert = Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "success",
          data: {
            result: [
              {
                metric: { alertname: "HighErrorRate", severity: "critical", instance: "api-1" },
                value: [0, "1"],
              },
            ],
          },
        }),
    } as Response);

    vi.spyOn(global, "fetch")
      .mockImplementationOnce(() => empty)
      .mockImplementationOnce(() => empty)
      .mockImplementationOnce(() => empty)
      .mockImplementationOnce(() => empty)
      .mockImplementationOnce(() => empty)
      .mockImplementationOnce(() => empty)
      .mockImplementationOnce(() => empty)
      .mockImplementationOnce(() => empty)
      .mockImplementationOnce(() => alert);

    const snapshot = await getMonitoringSnapshot();

    expect(snapshot.overallStatus).toBe("critical");
    expect(snapshot.alertCount).toBe(1);
    expect(snapshot.alerts[0]).toMatchObject({
      name: "HighErrorRate",
      severity: "critical",
      instance: "api-1",
      value: 1,
    });
  });

  it("clamps negative metric values to zero", async () => {
    const negative = Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: "success", data: { result: [{ metric: {}, value: [0, "-3"] }] } }),
    } as Response);

    vi.spyOn(global, "fetch")
      .mockImplementationOnce(() => negative)
      .mockImplementationOnce(() => negative)
      .mockImplementationOnce(() => negative)
      .mockImplementationOnce(() => negative)
      .mockImplementationOnce(() => negative)
      .mockImplementationOnce(() => negative)
      .mockImplementationOnce(() => negative)
      .mockImplementationOnce(() => negative)
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "success", data: { result: [] } }),
        } as Response),
      );

    const snapshot = await getMonitoringSnapshot();

    expect(snapshot.metrics.availability).toBe(0);
    expect(snapshot.metrics.errorRate).toBe(0);
  });
});
