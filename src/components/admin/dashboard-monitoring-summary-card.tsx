"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toLocaleCode } from "@/lib/i18n";
import { type MonitoringSnapshot } from "@/lib/monitoring";

type Props = {
  initialSnapshot: MonitoringSnapshot;
  locale: "en" | "ko" | "ja";
  labels: {
    monitoring: string;
    openMonitoring: string;
    overallStatus: string;
    activeAlerts: string;
    lastUpdated: string;
    healthy: string;
    warning: string;
    critical: string;
    unknown: string;
  };
};

export function DashboardMonitoringSummaryCard({
  initialSnapshot,
  locale,
  labels,
}: Props) {
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
            toast.error("모니터링 요약을 불러오지 못했습니다.");
            hasShownRefreshErrorToast.current = true;
          }
          return;
        }

        const next = (await response.json()) as MonitoringSnapshot;
        setSnapshot(next);
        hasShownRefreshErrorToast.current = false;
      } catch {
        if (!hasShownRefreshErrorToast.current) {
          toast.error("모니터링 요약을 불러오지 못했습니다.");
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{labels.monitoring}</CardTitle>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/monitoring">{labels.openMonitoring}</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{labels.overallStatus}</p>
          <Badge variant="outline">{statusLabel}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{labels.activeAlerts}</p>
          <p className="text-2xl font-semibold">{snapshot.alertCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{labels.lastUpdated}</p>
          <p className="text-sm font-medium">
            {new Date(snapshot.generatedAt).toLocaleString(localeCode)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
