// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  compare: vi.fn(),
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
  saveSessionRefreshToken: vi.fn(),
  getSessionRecord: vi.fn(),
  touchSessionLastSeen: vi.fn(),
  deleteSessionRefreshToken: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  compare: mocks.compare,
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: (config: unknown) => config,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/auth-session-store", () => ({
  saveSessionRefreshToken: mocks.saveSessionRefreshToken,
  getSessionRecord: mocks.getSessionRecord,
  touchSessionLastSeen: mocks.touchSessionLastSeen,
  deleteSessionRefreshToken: mocks.deleteSessionRefreshToken,
}));

import { authOptions } from "@/lib/auth";

describe("auth options", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authorizes admin user with username and password", async () => {
    mocks.prisma.user.findFirst.mockResolvedValueOnce({
      id: "u1",
      username: "admin",
      role: "ADMIN",
      passwordHash: "hashed",
    });
    mocks.compare.mockResolvedValueOnce(true);

    const provider = authOptions.providers?.[0] as unknown as {
      authorize: (
        credentials: { username: string; password: string },
        req: { headers: Record<string, string> },
      ) => Promise<unknown> | unknown;
    };

    const result = (await provider.authorize(
      { username: "admin", password: "admin" },
      { headers: { "x-forwarded-for": "1.1.1.1", "user-agent": "Vitest UA" } },
    )) as { id: string; username: string; role: string; lastIp: string; userAgent: string };

    expect(mocks.prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ username: "admin" }, { email: { equals: "admin", mode: "insensitive" } }],
      },
    });
    expect(result).toMatchObject({
      id: "u1",
      username: "admin",
      role: "ADMIN",
      lastIp: "1.1.1.1",
      userAgent: "Vitest UA",
    });
  });

  it("rejects non-admin users", async () => {
    mocks.prisma.user.findFirst.mockResolvedValueOnce({
      id: "u2",
      username: "user",
      role: "USER",
      passwordHash: "hashed",
    });

    const provider = authOptions.providers?.[0] as unknown as {
      authorize: (
        credentials: { username: string; password: string },
        req: { headers?: Record<string, string> },
      ) => Promise<unknown> | unknown;
    };

    const result = await provider.authorize({ username: "user", password: "pw" }, {});

    expect(result).toBeNull();
    expect(mocks.compare).not.toHaveBeenCalled();
  });

  it("creates token/session data at sign-in", async () => {
    mocks.saveSessionRefreshToken.mockResolvedValueOnce(undefined);
    mocks.getSessionRecord.mockImplementation(async () => ({
      refreshToken: mocks.saveSessionRefreshToken.mock.calls.at(-1)?.[0]?.refreshToken ?? "",
      issuedAt: 1,
      lastSeenAt: Date.now(),
      lastIp: null,
      userAgent: null,
    }));

    const jwt = authOptions.callbacks?.jwt;
    const result = await jwt?.({
      token: {},
      user: {
        id: "u1",
        role: "ADMIN",
        username: "admin",
        lastIp: "10.0.0.1",
        userAgent: "UA",
      },
    } as never);

    expect(mocks.saveSessionRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        lastIp: "10.0.0.1",
        userAgent: "UA",
      }),
    );
    expect(result).toMatchObject({
      sub: "u1",
      role: "ADMIN",
      username: "admin",
      error: undefined,
    });
    expect(result?.accessToken).toBeTypeOf("string");
    expect(result?.sessionId).toBeTypeOf("string");
    expect(result?.refreshToken).toBeTypeOf("string");
  });

  it("refreshes expired access token with valid refresh token", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);

    mocks.getSessionRecord
      .mockResolvedValueOnce({
        refreshToken: "rt1",
        issuedAt: 900_000,
        lastSeenAt: 995_000,
        lastIp: null,
        userAgent: null,
      })
      .mockResolvedValueOnce({
        refreshToken: "rt1",
        issuedAt: 900_000,
        lastSeenAt: 995_000,
        lastIp: null,
        userAgent: null,
      });
    mocks.saveSessionRefreshToken.mockResolvedValueOnce(undefined);

    const jwt = authOptions.callbacks?.jwt;
    const result = await jwt?.({
      token: {
        sub: "u1",
        role: "ADMIN",
        username: "admin",
        sessionId: "s1",
        refreshToken: "rt1",
        refreshTokenExpires: 2_000_000,
        accessToken: "old-at",
        accessTokenExpires: 999_000,
      },
    } as never);

    expect(mocks.getSessionRecord).toHaveBeenCalledTimes(2);
    expect(mocks.saveSessionRefreshToken).toHaveBeenCalledTimes(1);
    expect(result?.error).toBeUndefined();
    expect(result?.accessToken).toBeTypeOf("string");
    expect(result?.accessToken).not.toBe("old-at");
  });

  it("returns RefreshTokenExpired and cleans session when refresh token is expired", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);

    mocks.getSessionRecord.mockResolvedValueOnce({
      refreshToken: "rt1",
      issuedAt: 900_000,
      lastSeenAt: 995_000,
      lastIp: null,
      userAgent: null,
    });

    const jwt = authOptions.callbacks?.jwt;
    const result = await jwt?.({
      token: {
        sub: "u1",
        role: "ADMIN",
        username: "admin",
        sessionId: "s1",
        refreshToken: "rt1",
        refreshTokenExpires: 999_999,
        accessToken: "old-at",
        accessTokenExpires: 999_000,
      },
    } as never);

    expect(mocks.deleteSessionRefreshToken).toHaveBeenCalledWith("u1", "s1");
    expect(result?.error).toBe("RefreshTokenExpired");
  });

  it("deletes refresh token on signOut", async () => {
    const signOut = authOptions.events?.signOut;

    await signOut?.({ token: { sub: "u1", sessionId: "s1" } } as never);

    expect(mocks.deleteSessionRefreshToken).toHaveBeenCalledWith("u1", "s1");
  });
});
