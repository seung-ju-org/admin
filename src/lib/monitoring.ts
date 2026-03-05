export type MonitoringStatus = "healthy" | "warning" | "critical" | "unknown";

export type MonitoringSnapshot = {
  enabled: boolean;
  generatedAt: string;
  grafanaUrl: string | null;
  overallStatus: MonitoringStatus;
  alertCount: number;
  metrics: {
    availability: number | null;
    errorRate: number | null;
    p95Latency: number | null;
    p99Latency: number | null;
    cpuUsage: number | null;
    memoryUsage: number | null;
    queueBacklog: number | null;
    restarts30m: number | null;
  };
  alerts: Array<{
    name: string;
    severity: string;
    instance: string;
    value: number;
  }>;
};

type PrometheusVectorResult = {
  metric: Record<string, string>;
  value: [number, string];
};

const DEFAULT_PROMETHEUS_URL = "https://prometheus.seung-ju.com";
const DEFAULT_GRAFANA_URL = "https://grafana.seung-ju.com";

const queries = {
  availability: "avg(up) * 100",
  errorRate:
    "(sum(rate(http_requests_total{status=~\"5..\"}[5m])) / clamp_min(sum(rate(http_requests_total[5m])), 1)) * 100",
  p95Latency:
    "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
  p99Latency:
    "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
  cpuUsage: "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
  memoryUsage:
    "(1 - (avg(node_memory_MemAvailable_bytes) / clamp_min(avg(node_memory_MemTotal_bytes), 1))) * 100",
  queueBacklog:
    "sum(kafka_consumergroup_lag) + sum(rabbitmq_queue_messages_ready) + sum(redis_stream_pending_messages)",
  restarts30m: "sum(increase(kube_pod_container_status_restarts_total[30m]))",
  activeAlerts: "ALERTS{alertstate=\"firing\"}",
} as const;

async function queryPrometheus(query: string): Promise<PrometheusVectorResult[]> {
  const baseUrl = (process.env.PROMETHEUS_BASE_URL || DEFAULT_PROMETHEUS_URL).replace(/\/+$/, "");
  const timeout = Number(process.env.PROMETHEUS_TIMEOUT_MS || "4000");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const headers: HeadersInit = {};

  if (process.env.PROMETHEUS_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${process.env.PROMETHEUS_AUTH_TOKEN}`;
  }

  try {
    const response = await fetch(
      `${baseUrl}/api/v1/query?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers,
        signal: controller.signal,
        next: { revalidate: 15 },
      },
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      status?: string;
      data?: { result?: PrometheusVectorResult[] };
    };

    if (payload.status !== "success") {
      return [];
    }

    return payload.data?.result ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function parseValue(result: PrometheusVectorResult[]): number | null {
  if (result.length === 0) {
    return null;
  }

  const parsed = Number.parseFloat(result[0].value[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampNonNegative(value: number | null) {
  if (value === null) {
    return null;
  }

  return value < 0 ? 0 : value;
}

function getMetricStatus(snapshot: MonitoringSnapshot): MonitoringStatus {
  const { errorRate, p95Latency, cpuUsage, memoryUsage } = snapshot.metrics;

  if (snapshot.alertCount > 0) {
    return "critical";
  }
  if (
    (errorRate !== null && errorRate >= 5) ||
    (p95Latency !== null && p95Latency >= 2) ||
    (cpuUsage !== null && cpuUsage >= 90) ||
    (memoryUsage !== null && memoryUsage >= 95)
  ) {
    return "critical";
  }
  if (
    (errorRate !== null && errorRate >= 1) ||
    (p95Latency !== null && p95Latency >= 1) ||
    (cpuUsage !== null && cpuUsage >= 75) ||
    (memoryUsage !== null && memoryUsage >= 85)
  ) {
    return "warning";
  }

  const hasAnyMetric = Object.values(snapshot.metrics).some((metric) => metric !== null);
  return hasAnyMetric ? "healthy" : "unknown";
}

export async function getMonitoringSnapshot(): Promise<MonitoringSnapshot> {
  const enabled = Boolean(process.env.PROMETHEUS_BASE_URL || DEFAULT_PROMETHEUS_URL);
  const grafanaUrl = process.env.GRAFANA_DASHBOARD_URL || DEFAULT_GRAFANA_URL;

  if (!enabled) {
    return {
      enabled: false,
      generatedAt: new Date().toISOString(),
      grafanaUrl,
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
    };
  }

  const [
    availabilityRaw,
    errorRateRaw,
    p95LatencyRaw,
    p99LatencyRaw,
    cpuUsageRaw,
    memoryUsageRaw,
    queueBacklogRaw,
    restartsRaw,
    alertsRaw,
  ] = await Promise.all([
    queryPrometheus(queries.availability),
    queryPrometheus(queries.errorRate),
    queryPrometheus(queries.p95Latency),
    queryPrometheus(queries.p99Latency),
    queryPrometheus(queries.cpuUsage),
    queryPrometheus(queries.memoryUsage),
    queryPrometheus(queries.queueBacklog),
    queryPrometheus(queries.restarts30m),
    queryPrometheus(queries.activeAlerts),
  ]);

  const alerts = alertsRaw
    .map((item) => {
      const value = Number.parseFloat(item.value[1]);
      if (!Number.isFinite(value) || value <= 0) {
        return null;
      }

      return {
        name: item.metric.alertname || "unknown_alert",
        severity: item.metric.severity || "unknown",
        instance: item.metric.instance || item.metric.job || "-",
        value,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, 20);

  const snapshot: MonitoringSnapshot = {
    enabled: true,
    generatedAt: new Date().toISOString(),
    grafanaUrl,
    overallStatus: "unknown",
    alertCount: alerts.length,
    metrics: {
      availability: clampNonNegative(parseValue(availabilityRaw)),
      errorRate: clampNonNegative(parseValue(errorRateRaw)),
      p95Latency: clampNonNegative(parseValue(p95LatencyRaw)),
      p99Latency: clampNonNegative(parseValue(p99LatencyRaw)),
      cpuUsage: clampNonNegative(parseValue(cpuUsageRaw)),
      memoryUsage: clampNonNegative(parseValue(memoryUsageRaw)),
      queueBacklog: clampNonNegative(parseValue(queueBacklogRaw)),
      restarts30m: clampNonNegative(parseValue(restartsRaw)),
    },
    alerts,
  };

  snapshot.overallStatus = getMetricStatus(snapshot);
  return snapshot;
}
