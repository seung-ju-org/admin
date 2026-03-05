import { getRedisClient } from "@/lib/redis";

const REFRESH_TOKEN_KEY_PREFIX = "auth:refresh";

type StoredSessionRecord = {
  refreshToken: string;
  issuedAt: number;
  lastSeenAt: number;
  lastIp: string | null;
  userAgent: string | null;
};

export type UserSessionInfo = {
  sessionId: string;
  issuedAt: number;
  lastSeenAt: number;
  lastIp: string | null;
  userAgent: string | null;
  expiresAt: number | null;
};

function getRefreshTokenKey(userId: string, sessionId: string) {
  return `${REFRESH_TOKEN_KEY_PREFIX}:${userId}:${sessionId}`;
}

function parseSessionIdFromKey(key: string) {
  const chunks = key.split(":");
  return chunks[chunks.length - 1] ?? "";
}

function parseStoredSessionRecord(value: string | null): StoredSessionRecord | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredSessionRecord>;

    if (
      typeof parsed.refreshToken !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.lastSeenAt !== "number"
    ) {
      return null;
    }

    return {
      refreshToken: parsed.refreshToken,
      issuedAt: parsed.issuedAt,
      lastSeenAt: parsed.lastSeenAt,
      lastIp: typeof parsed.lastIp === "string" ? parsed.lastIp : null,
      userAgent: typeof parsed.userAgent === "string" ? parsed.userAgent : null,
    };
  } catch {
    return null;
  }
}

async function scanKeys(pattern: string) {
  const redis = await getRedisClient();
  const keys: string[] = [];
  let cursor = 0;

  do {
    const reply = await redis.scan(cursor, {
      MATCH: pattern,
      COUNT: 200,
    });
    cursor = reply.cursor;
    keys.push(...reply.keys);
  } while (cursor !== 0);

  return keys;
}

export async function saveSessionRefreshToken(input: {
  userId: string;
  sessionId: string;
  refreshToken: string;
  refreshTokenExpiresAt: number;
  issuedAt: number;
  lastSeenAt: number;
  lastIp: string | null;
  userAgent: string | null;
}) {
  const redis = await getRedisClient();
  const ttlSeconds = Math.max(1, Math.floor((input.refreshTokenExpiresAt - Date.now()) / 1000));
  const value: StoredSessionRecord = {
    refreshToken: input.refreshToken,
    issuedAt: input.issuedAt,
    lastSeenAt: input.lastSeenAt,
    lastIp: input.lastIp,
    userAgent: input.userAgent,
  };

  await redis.set(getRefreshTokenKey(input.userId, input.sessionId), JSON.stringify(value), {
    EX: ttlSeconds,
  });
}

export async function getSessionRefreshToken(userId: string, sessionId: string) {
  const record = await getSessionRecord(userId, sessionId);
  return record?.refreshToken ?? null;
}

export async function getSessionRecord(userId: string, sessionId: string) {
  const redis = await getRedisClient();
  const value = await redis.get(getRefreshTokenKey(userId, sessionId));
  return parseStoredSessionRecord(value);
}

export async function deleteSessionRefreshToken(userId: string, sessionId: string) {
  const redis = await getRedisClient();
  await redis.del(getRefreshTokenKey(userId, sessionId));
}

export async function touchSessionLastSeen(userId: string, sessionId: string, lastSeenAt: number) {
  const redis = await getRedisClient();
  const key = getRefreshTokenKey(userId, sessionId);
  const [value, ttlSeconds] = await Promise.all([redis.get(key), redis.ttl(key)]);
  const current = parseStoredSessionRecord(value);

  if (!current || ttlSeconds <= 0) {
    return false;
  }

  const next: StoredSessionRecord = {
    ...current,
    lastSeenAt,
  };

  await redis.set(key, JSON.stringify(next), {
    EX: ttlSeconds,
  });

  return true;
}

export async function countUserActiveSessions(userId: string) {
  const keys = await scanKeys(`${REFRESH_TOKEN_KEY_PREFIX}:${userId}:*`);
  return keys.length;
}

export async function countActiveSessionsByUser(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  const sessionsByUserId: Record<string, number> = {};

  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      sessionsByUserId[userId] = await countUserActiveSessions(userId);
    }),
  );

  return sessionsByUserId;
}

export async function deleteAllUserSessions(userId: string) {
  const redis = await getRedisClient();
  const keys = await scanKeys(`${REFRESH_TOKEN_KEY_PREFIX}:${userId}:*`);

  if (keys.length === 0) {
    return 0;
  }

  return redis.del(keys);
}

export async function listUserSessions(userId: string): Promise<UserSessionInfo[]> {
  const redis = await getRedisClient();
  const keys = await scanKeys(`${REFRESH_TOKEN_KEY_PREFIX}:${userId}:*`);

  const sessions = await Promise.all(
    keys.map(async (key) => {
      const [value, ttlSeconds] = await Promise.all([redis.get(key), redis.ttl(key)]);
      const record = parseStoredSessionRecord(value);

      if (!record || ttlSeconds <= 0) {
        return null;
      }

      return {
        sessionId: parseSessionIdFromKey(key),
        issuedAt: record.issuedAt,
        lastSeenAt: record.lastSeenAt,
        lastIp: record.lastIp,
        userAgent: record.userAgent,
        expiresAt: Date.now() + ttlSeconds * 1000,
      } as UserSessionInfo;
    }),
  );

  return sessions
    .filter((session): session is UserSessionInfo => Boolean(session))
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}
