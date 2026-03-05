import { type MonitoringSnapshot } from "@/lib/monitoring";

export type NotificationLevel = "info" | "warning" | "critical";

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  level: NotificationLevel;
  createdAt: string;
};

export function buildNotifications(snapshot: MonitoringSnapshot) {
  const createdAt = snapshot.generatedAt;
  const notifications: NotificationItem[] = [];

  if (!snapshot.enabled) {
    notifications.push({
      id: "monitoring-not-configured",
      title: "Monitoring",
      description: "Monitoring is not configured.",
      level: "warning",
      createdAt,
    });
  }

  for (const alert of snapshot.alerts) {
    const level: NotificationLevel =
      alert.severity === "critical"
        ? "critical"
        : alert.severity === "warning"
          ? "warning"
          : "info";

    notifications.push({
      id: `alert-${alert.name}-${alert.instance}`,
      title: alert.name,
      description: `${alert.instance} · ${alert.severity}`,
      level,
      createdAt,
    });
  }

  return notifications;
}

function encodeCursor(index: number) {
  return Buffer.from(String(index), "utf-8").toString("base64url");
}

function decodeCursor(cursor: string | null): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    const index = Number.parseInt(decoded, 10);
    if (Number.isNaN(index) || index < 0) return 0;
    return index;
  } catch {
    return 0;
  }
}

export function paginateNotifications(
  notifications: NotificationItem[],
  cursor: string | null,
  limit: number,
) {
  const safeLimit = Math.min(50, Math.max(1, limit));
  const startIndex = decodeCursor(cursor);
  const items = notifications.slice(startIndex, startIndex + safeLimit);
  const nextIndex = startIndex + items.length;
  const hasMore = nextIndex < notifications.length;

  return {
    items,
    unreadCount: notifications.length,
    hasMore,
    nextCursor: hasMore ? encodeCursor(nextIndex) : null,
  };
}

export function buildNotificationsFingerprint(notifications: NotificationItem[]) {
  return notifications.map((item) => `${item.id}:${item.createdAt}`).join("|");
}
