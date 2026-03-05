import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { buildNotifications, paginateNotifications } from "@/lib/admin-notifications";
import { getMonitoringSnapshot } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 20;

  const snapshot = await getMonitoringSnapshot();
  const notifications = buildNotifications(snapshot);
  const payload = paginateNotifications(notifications, cursor, limit);

  return NextResponse.json(
    {
      unreadCount: payload.unreadCount,
      notifications: payload.items,
      nextCursor: payload.nextCursor,
      hasMore: payload.hasMore,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
