import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getMonitoringSnapshot } from "@/lib/monitoring";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getMonitoringSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
