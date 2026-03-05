import { beforeEach, describe, expect, it, vi } from "vitest";

const redisMock = {
  set: vi.fn(),
  get: vi.fn(),
  ttl: vi.fn(),
  del: vi.fn(),
  scan: vi.fn(),
};

vi.mock("@/lib/redis", () => ({
  getRedisClient: vi.fn(async () => redisMock),
}));

import {
  countActiveSessionsByUser,
  countUserActiveSessions,
  deleteAllUserSessions,
  deleteSessionRefreshToken,
  getSessionRecord,
  getSessionRefreshToken,
  listUserSessions,
  saveSessionRefreshToken,
  touchSessionLastSeen,
} from "@/lib/auth-session-store";

describe("auth-session-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves refresh token with ttl", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);

    await saveSessionRefreshToken({
      userId: "u1",
      sessionId: "s1",
      refreshToken: "rt1",
      refreshTokenExpiresAt: 11_000,
      issuedAt: 1_000,
      lastSeenAt: 1_000,
      lastIp: "127.0.0.1",
      userAgent: "UA",
    });

    expect(redisMock.set).toHaveBeenCalledWith(
      "auth:refresh:u1:s1",
      expect.any(String),
      { EX: 10 },
    );
  });

  it("returns session refresh token when record exists", async () => {
    redisMock.get.mockResolvedValueOnce(
      JSON.stringify({ refreshToken: "rt2", issuedAt: 1, lastSeenAt: 2, lastIp: null, userAgent: null }),
    );

    await expect(getSessionRefreshToken("u1", "s1")).resolves.toBe("rt2");
  });

  it("touches session lastSeen while preserving ttl", async () => {
    redisMock.get.mockResolvedValueOnce(
      JSON.stringify({ refreshToken: "rt3", issuedAt: 1, lastSeenAt: 2, lastIp: null, userAgent: null }),
    );
    redisMock.ttl.mockResolvedValueOnce(120);

    await expect(touchSessionLastSeen("u1", "s1", 999)).resolves.toBe(true);
    expect(redisMock.set).toHaveBeenCalledWith(
      "auth:refresh:u1:s1",
      expect.stringContaining('"lastSeenAt":999'),
      { EX: 120 },
    );
  });

  it("returns false when session is missing during touch", async () => {
    redisMock.get.mockResolvedValueOnce(null);
    redisMock.ttl.mockResolvedValueOnce(-1);

    await expect(touchSessionLastSeen("u1", "s1", 1)).resolves.toBe(false);
  });

  it("scans and counts active sessions", async () => {
    redisMock.scan
      .mockResolvedValueOnce({ cursor: 1, keys: ["auth:refresh:u1:s1"] })
      .mockResolvedValueOnce({ cursor: 0, keys: ["auth:refresh:u1:s2"] });

    await expect(countUserActiveSessions("u1")).resolves.toBe(2);
  });

  it("lists sessions sorted by lastSeen desc", async () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);

    redisMock.scan.mockResolvedValueOnce({ cursor: 0, keys: ["auth:refresh:u1:s1", "auth:refresh:u1:s2"] });
    redisMock.get
      .mockResolvedValueOnce(
        JSON.stringify({ refreshToken: "r1", issuedAt: 1, lastSeenAt: 10, lastIp: "1.1.1.1", userAgent: "UA1" }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({ refreshToken: "r2", issuedAt: 2, lastSeenAt: 20, lastIp: null, userAgent: null }),
      );
    redisMock.ttl.mockResolvedValueOnce(30).mockResolvedValueOnce(40);

    const sessions = await listUserSessions("u1");

    expect(sessions).toHaveLength(2);
    expect(sessions[0].sessionId).toBe("s2");
    expect(sessions[1].sessionId).toBe("s1");
  });

  it("deletes single and all sessions", async () => {
    redisMock.scan.mockResolvedValueOnce({ cursor: 0, keys: ["auth:refresh:u1:s1", "auth:refresh:u1:s2"] });
    redisMock.del.mockResolvedValue(2);

    await deleteSessionRefreshToken("u1", "s1");
    await expect(deleteAllUserSessions("u1")).resolves.toBe(2);

    expect(redisMock.del).toHaveBeenCalledWith("auth:refresh:u1:s1");
    expect(redisMock.del).toHaveBeenCalledWith(["auth:refresh:u1:s1", "auth:refresh:u1:s2"]);
  });

  it("counts sessions by user with duplicate ids removed", async () => {
    redisMock.scan
      .mockResolvedValueOnce({ cursor: 0, keys: ["auth:refresh:u1:s1"] })
      .mockResolvedValueOnce({ cursor: 0, keys: ["auth:refresh:u2:s1", "auth:refresh:u2:s2"] });

    const result = await countActiveSessionsByUser(["u1", "u1", "u2", ""]);

    expect(result).toEqual({ u1: 1, u2: 2 });
  });

  it("returns null for malformed stored record", async () => {
    redisMock.get.mockResolvedValueOnce("{bad json");

    await expect(getSessionRecord("u1", "s1")).resolves.toBeNull();
  });
});
