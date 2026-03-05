// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  countActiveSessionsByUser: vi.fn(),
  deleteAllUserSessions: vi.fn(),
  deleteSessionRefreshToken: vi.fn(),
  listUserSessions: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/auth-session-store", () => ({
  countActiveSessionsByUser: mocks.countActiveSessionsByUser,
  deleteAllUserSessions: mocks.deleteAllUserSessions,
  deleteSessionRefreshToken: mocks.deleteSessionRefreshToken,
  listUserSessions: mocks.listUserSessions,
}));

import { DELETE, GET } from "@/app/api/admin/sessions/route";

describe("/api/admin/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for GET when unauthorized", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "USER" } });

    const res = await GET(new Request("https://example.com/api/admin/sessions"));
    expect(res.status).toBe(401);
  });

  it("returns user sessions when userId query exists", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } });
    mocks.listUserSessions.mockResolvedValueOnce([{ sessionId: "s1" }]);

    const res = await GET(new Request("https://example.com/api/admin/sessions?userId=u1"));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(mocks.listUserSessions).toHaveBeenCalledWith("u1");
    expect(payload.sessions).toEqual([{ sessionId: "s1" }]);
  });

  it("returns deduplicated sessionsByUserId", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } });
    mocks.countActiveSessionsByUser.mockResolvedValueOnce({ u1: 2, u2: 1 });

    const res = await GET(new Request("https://example.com/api/admin/sessions?userIds=u1,u1,,u2"));

    expect(res.status).toBe(200);
    expect(mocks.countActiveSessionsByUser).toHaveBeenCalledWith(["u1", "u2"]);
  });

  it("returns empty mapping when userIds query is empty", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } });

    const res = await GET(new Request("https://example.com/api/admin/sessions?userIds="));
    const payload = await res.json();

    expect(payload.sessionsByUserId).toEqual({});
    expect(mocks.countActiveSessionsByUser).not.toHaveBeenCalled();
  });

  it("deletes a single session when sessionId is provided", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } });

    const res = await DELETE(
      new Request("https://example.com/api/admin/sessions", {
        method: "DELETE",
        body: JSON.stringify({ userId: "u1", sessionId: "s1" }),
      }),
    );
    const payload = await res.json();

    expect(mocks.deleteSessionRefreshToken).toHaveBeenCalledWith("u1", "s1");
    expect(payload.deletedSessionCount).toBe(1);
  });

  it("deletes all sessions when sessionId is absent", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } });
    mocks.deleteAllUserSessions.mockResolvedValueOnce(5);

    const res = await DELETE(
      new Request("https://example.com/api/admin/sessions", {
        method: "DELETE",
        body: JSON.stringify({ userId: "u1" }),
      }),
    );
    const payload = await res.json();

    expect(mocks.deleteAllUserSessions).toHaveBeenCalledWith("u1");
    expect(payload.deletedSessionCount).toBe(5);
  });

  it("returns 400 for invalid json body", async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: "ADMIN" } });

    const res = await DELETE(
      new Request("https://example.com/api/admin/sessions", {
        method: "DELETE",
        body: "{not-json",
      }),
    );

    expect(res.status).toBe(400);
  });
});
