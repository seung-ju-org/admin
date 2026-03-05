// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

describe("nextauth route", () => {
  it("creates handler from authOptions and exports GET/POST", async () => {
    vi.resetModules();

    const handler = vi.fn();
    const nextAuth = vi.fn(() => handler);
    const authOptions = { secret: "test" };

    vi.doMock("next-auth", () => ({
      default: nextAuth,
    }));

    vi.doMock("@/lib/auth", () => ({
      authOptions,
    }));

    const route = await import("@/app/api/auth/[...nextauth]/route");

    expect(nextAuth).toHaveBeenCalledWith(authOptions);
    expect(route.GET).toBe(handler);
    expect(route.POST).toBe(handler);
  });
});
