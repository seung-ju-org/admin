"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { MonitoringAlertsTable } from "@/components/admin/monitoring-alerts-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toLocaleCode, type Messages } from "@/lib/i18n";
import { type MonitoringSnapshot, type MonitoringStatus } from "@/lib/monitoring";

type Props = {
  initialSnapshot: MonitoringSnapshot;
  locale: "en" | "ko" | "ja";
  labels: Messages["monitoringPage"];
};

function statusTone(status: MonitoringStatus) {
  if (status === "critical") {
    return "bg-red-500/15 text-red-600 border-red-500/40";
  }
  if (status === "warning") {
    return "bg-amber-500/15 text-amber-600 border-amber-500/40";
  }
  if (status === "healthy") {
    return "bg-emerald-500/15 text-emerald-600 border-emerald-500/40";
  }
  return "bg-muted text-muted-foreground border-border";
}

function formatMetric(value: number | null, kind: "percent" | "seconds" | "count") {
  if (value === null) {
    return "-";
  }

  if (kind === "seconds") {
    return `${value.toFixed(3)}s`;
  }
  if (kind === "percent") {
    return `${value.toFixed(2)}%`;
  }
  return value.toLocaleString();
}

export function MonitoringOverview({ initialSnapshot, locale, labels }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const hasShownRefreshErrorToast = useRef(false);
  const localeCode = toLocaleCode(locale);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const response = await fetch("/api/admin/monitoring/summary", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok || !active) {
          if (!hasShownRefreshErrorToast.current) {
            toast.error("모니터링 데이터를 불러오지 못했습니다.");
            hasShownRefreshErrorToast.current = true;
          }
          return;
        }

        const next = (await response.json()) as MonitoringSnapshot;
        setSnapshot(next);
        hasShownRefreshErrorToast.current = false;
      } catch {
        if (!hasShownRefreshErrorToast.current) {
          toast.error("모니터링 데이터를 불러오지 못했습니다.");
          hasShownRefreshErrorToast.current = true;
        }
      }
    };

    const timer = setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const statusLabel =
    snapshot.overallStatus === "healthy"
      ? labels.healthy
      : snapshot.overallStatus === "warning"
        ? labels.warning
        : snapshot.overallStatus === "critical"
          ? labels.critical
          : labels.unknown;

  const metricCards = [
    {
      title: labels.cards.availability,
      value: formatMetric(snapshot.metrics.availability, "percent"),
    },
    {
      title: labels.cards.errorRate,
      value: formatMetric(snapshot.metrics.errorRate, "percent"),
    },
    {
      title: labels.cards.p95Latency,
      value: formatMetric(snapshot.metrics.p95Latency, "seconds"),
    },
    {
      title: labels.cards.p99Latency,
      value: formatMetric(snapshot.metrics.p99Latency, "seconds"),
    },
    {
      title: labels.cards.cpuUsage,
      value: formatMetric(snapshot.metrics.cpuUsage, "percent"),
    },
    {
      title: labels.cards.memoryUsage,
      value: formatMetric(snapshot.metrics.memoryUsage, "percent"),
    },
    {
      title: labels.cards.queueBacklog,
      value: formatMetric(snapshot.metrics.queueBacklog, "count"),
    },
    {
      title: labels.cards.restarts,
      value: formatMetric(snapshot.metrics.restarts30m, "count"),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{labels.title}</h1>
          <p className="text-sm text-muted-foreground">{labels.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {snapshot.grafanaUrl ? (
            <Button asChild>
              <Link href={snapshot.grafanaUrl} target="_blank" rel="noreferrer">
                {labels.grafana}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {!snapshot.enabled ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.unavailable}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {labels.unavailableDescription}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{labels.overallStatus}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge className={statusTone(snapshot.overallStatus)} variant="outline">
                  {statusLabel}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{labels.activeAlerts}</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{snapshot.alertCount}</CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{labels.lastUpdated}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm font-medium">
                {new Date(snapshot.generatedAt).toLocaleString(localeCode)}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card) => (
              <Card key={card.title}>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{card.value}</CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{labels.activeAlerts}</CardTitle>
              <p className="text-sm text-muted-foreground">{labels.alertsDescription}</p>
            </CardHeader>
            <CardContent>
              <MonitoringAlertsTable
                alerts={snapshot.alerts}
                emptyLabel={labels.noAlerts}
                labels={labels.alertsTable}
              />
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
