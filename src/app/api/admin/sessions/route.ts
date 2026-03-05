import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  countActiveSessionsByUser,
  deleteAllUserSessions,
  deleteSessionRefreshToken,
  listUserSessions,
} from "@/lib/auth-session-store";

function parseUserIdsParam(raw: string | null) {
  if (!raw) {
    return [];
  }

  return [...new Set(raw.split(",").map((value) => value.trim()).filter(Boolean))].slice(0, 100);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim();

  if (userId) {
    const sessions = await listUserSessions(userId);
    return NextResponse.json(
      { sessions },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }

  const userIds = parseUserIdsParam(searchParams.get("userIds"));

  if (userIds.length === 0) {
    return NextResponse.json(
      { sessionsByUserId: {} },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }

  const sessionsByUserId = await countActiveSessionsByUser(userIds);

  return NextResponse.json(
    { sessionsByUserId },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: string; sessionId?: string } = {};
  try {
    body = (await request.json()) as { userId?: string; sessionId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  const sessionId = body.sessionId?.trim();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (sessionId) {
    await deleteSessionRefreshToken(userId, sessionId);
    return NextResponse.json({ ok: true, deletedSessionCount: 1 });
  }

  const deletedSessionCount = await deleteAllUserSessions(userId);
  return NextResponse.json({ ok: true, deletedSessionCount });
}
