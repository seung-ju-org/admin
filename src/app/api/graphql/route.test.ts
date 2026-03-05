// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

type CapturedResolvers = {
  Query: {
    projects: (parent: unknown, args: unknown, context: unknown) => Promise<unknown>;
    careers: (parent: unknown, args: unknown, context: unknown) => Promise<unknown>;
  };
  Mutation: {
    deleteProject: (parent: unknown, args: unknown, context: unknown) => Promise<unknown>;
    deleteCareer: (parent: unknown, args: unknown, context: unknown) => Promise<unknown>;
  };
};

const mocks = vi.hoisted(() => ({
  captured: {} as { resolvers?: CapturedResolvers },
  prisma: {
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    user: {
      findFirst: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    portfolioProject: {
      findFirst: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    portfolioCareer: {
      findFirst: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    portfolioProjectTranslation: {
      aggregate: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    portfolioCareerTranslation: {
      aggregate: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    portfolioTechnology: {
      upsert: vi.fn(),
    },
    portfolioProjectTechnology: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("graphql-yoga", () => ({
  createSchema: vi.fn((input: { resolvers: CapturedResolvers }) => {
    mocks.captured.resolvers = input.resolvers;
    return input;
  }),
  createYoga: vi.fn(() => ({ fetch: vi.fn() })),
}));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/id", () => ({ createId: vi.fn(() => "new-id") }));
vi.mock("@/lib/mail-sync", () => ({
  isMailSyncRequired: vi.fn(() => false),
  syncMailUser: vi.fn(),
}));

import "@/app/api/graphql/route";

describe("graphql resolvers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("projects query uses server paging filters without deletedAt", async () => {
    mocks.prisma.portfolioProject.count.mockResolvedValueOnce(1);
    mocks.prisma.portfolioProject.findMany.mockResolvedValueOnce([
      {
        id: "p1",
        slug: "portfolio-1",
        displayOrder: 1,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: null,
        isOngoing: true,
        isPublished: true,
        links: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
        translations: [
          {
            locale: "KO",
            title: "포트폴리오",
            company: "회사",
            role: "개발",
            achievements: ["성과"],
          },
        ],
        technologies: [{ technology: { name: "Next.js" }, displayOrder: 0 }],
      },
    ]);

    const result = (await mocks.captured.resolvers?.Query.projects(
      {},
      {
        page: 2,
        pageSize: 10,
        slug: "port",
        isPublished: true,
        sortBy: "DISPLAY_ORDER",
        sortOrder: "ASC",
      },
      { session: { user: { id: "a1", role: "ADMIN" } } },
    )) as { totalCount: number; items: Array<{ slug: string }> };

    expect(mocks.prisma.portfolioProject.count).toHaveBeenCalledWith({
      where: {
        AND: [{ slug: { contains: "port", mode: "insensitive" } }, { isPublished: true }],
      },
    });
    expect(mocks.prisma.portfolioProject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result.totalCount).toBe(1);
    expect(result.items[0].slug).toBe("portfolio-1");
  });

  it("careers query uses prisma paging with localized translations", async () => {
    mocks.prisma.portfolioCareer.count.mockResolvedValueOnce(1);
    mocks.prisma.portfolioCareer.findMany.mockResolvedValueOnce([
      {
        id: "c1",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: null,
        isCurrent: true,
        isPublished: true,
        displayOrder: 1,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
        translations: [
          {
            locale: "KO",
            company: "에이컴",
            position: "엔지니어",
            description: "설명",
          },
        ],
      },
    ]);

    const result = (await mocks.captured.resolvers?.Query.careers(
      {},
      {
        page: 1,
        pageSize: 10,
        company: "ac",
        isCurrent: true,
        locale: "KO",
        sortBy: "DISPLAY_ORDER",
        sortOrder: "ASC",
      },
      { session: { user: { id: "a1", role: "ADMIN" } } },
    )) as { totalCount: number; items: Array<{ company: string }> };

    expect(mocks.prisma.portfolioCareer.count).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.portfolioCareer.findMany).toHaveBeenCalledTimes(1);
    expect(result.totalCount).toBe(1);
    expect(result.items[0].company).toBe("에이컴");
  });

  it("deleteProject mutation hard-deletes project", async () => {
    mocks.prisma.portfolioProject.findFirst.mockResolvedValueOnce({ id: "p1" });
    mocks.prisma.portfolioProject.delete.mockResolvedValueOnce({ id: "p1" });

    const result = await mocks.captured.resolvers?.Mutation.deleteProject(
      {},
      { projectId: "p1" },
      { session: { user: { id: "a1", role: "ADMIN" } } },
    );

    expect(mocks.prisma.portfolioProject.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
    expect(mocks.prisma.portfolioProject.update).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("deleteCareer mutation hard-deletes career", async () => {
    mocks.prisma.portfolioCareer.findFirst.mockResolvedValueOnce({ id: "c1" });
    mocks.prisma.portfolioCareer.delete.mockResolvedValueOnce({ id: "c1" });

    const result = await mocks.captured.resolvers?.Mutation.deleteCareer(
      {},
      { careerId: "c1" },
      { session: { user: { id: "a1", role: "ADMIN" } } },
    );

    expect(mocks.prisma.portfolioCareer.delete).toHaveBeenCalledWith({
      where: { id: "c1" },
    });
    expect(result).toBe(true);
  });

  it("throws FORBIDDEN for non-admin access", async () => {
    await expect(
      mocks.captured.resolvers?.Query.projects({}, {}, { session: { user: { id: "u1", role: "USER" } } }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
