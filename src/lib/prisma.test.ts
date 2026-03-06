// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("prisma singleton", () => {
  it("uses development log level and stores global prisma", async () => {
    const prismaCtor = vi.fn(function PrismaClient(this: { options: unknown }, options: unknown) {
      this.options = options;
    });

    vi.stubEnv("NODE_ENV", "development");
    vi.doMock("@prisma/client", () => ({
      PrismaClient: prismaCtor,
    }));

    const prismaModule = await import("@/lib/prisma");

    expect(prismaCtor).toHaveBeenCalledWith({ log: ["warn", "error"] });
    expect((globalThis as { prisma?: unknown }).prisma).toBe(prismaModule.prisma);
  });

  it("uses production log level and does not overwrite global prisma", async () => {
    const prismaCtor = vi.fn(function PrismaClient(this: { options: unknown }, options: unknown) {
      this.options = options;
    });

    vi.stubEnv("NODE_ENV", "production");
    vi.doMock("@prisma/client", () => ({
      PrismaClient: prismaCtor,
    }));

    const prismaModule = await import("@/lib/prisma");

    expect(prismaCtor).toHaveBeenCalledWith({ log: ["error"] });
    expect((globalThis as { prisma?: unknown }).prisma).toBeUndefined();
    expect(prismaModule.prisma).toBeDefined();
  });
});
