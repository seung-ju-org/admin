import { Prisma, Role } from "@prisma/client";
import { GraphQLError } from "graphql";
import { createSchema, createYoga } from "graphql-yoga";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { createId } from "@/lib/id";
import { isMailSyncRequired, syncMailUser } from "@/lib/mail-sync";
import { prisma } from "@/lib/prisma";
import { getRedisClient } from "@/lib/redis";

type SessionContext = {
  user: {
    id: string;
    role: "ADMIN" | "USER";
  };
} | null;

type ProjectLocale = "EN" | "KO" | "JA";
type CareerSortField =
  | "CREATED_AT"
  | "COMPANY"
  | "POSITION"
  | "DISPLAY_ORDER"
  | "START_DATE"
  | "END_DATE"
  | "IS_CURRENT"
  | "IS_PUBLISHED";

type CareerWithTranslations = Prisma.PortfolioCareerGetPayload<{
  select: {
    id: true;
    company: true;
    position: true;
    overview: true;
    slug: true;
    startDate: true;
    endDate: true;
    isOngoing: true;
    displayOrder: true;
    createdAt: true;
    updatedAt: true;
    translations: true;
  };
}>;

function mapCareerRecord(career: CareerWithTranslations, locale: "EN" | "KO" | "JA") {
  const translation =
    career.translations.find((t) => t.locale === locale) ?? career.translations[0] ?? null;

  return {
    id: career.id,
    company: translation?.company ?? career.company,
    position: translation?.position ?? career.position,
    description: translation?.overview ?? career.overview ?? null,
    startDate: career.startDate.toISOString(),
    endDate: career.endDate?.toISOString() ?? null,
    isCurrent: career.isOngoing,
    isPublished: true,
    displayOrder: career.displayOrder,
    createdAt: career.createdAt.toISOString(),
    updatedAt: career.updatedAt.toISOString(),
  };
}

function assertAdmin(session: SessionContext) {
  if (!session || session.user.role !== "ADMIN") {
    throw new GraphQLError("FORBIDDEN", {
      extensions: {
        code: "FORBIDDEN",
      },
    });
  }
}

function parseDateOrThrow(value: string, field: string) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
    ? `${value.trim()}T00:00:00.000Z`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`INVALID_DATE:${field}`);
  }
  return date;
}

function parseLinks(links?: string | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (!links?.trim()) return Prisma.DbNull;
  try {
    return JSON.parse(links);
  } catch {
    throw new Error("INVALID_JSON:links");
  }
}

function parseAchievements(achievements: string): Prisma.InputJsonValue {
  try {
    const value = JSON.parse(achievements);
    if (!Array.isArray(value)) {
      throw new Error("INVALID_JSON:achievements");
    }
    return value as Prisma.InputJsonValue;
  } catch {
    throw new Error("INVALID_JSON:achievements");
  }
}

function mapProjectLocale(locale?: ProjectLocale | null): "EN" | "KO" | "JA" {
  if (locale === "EN") return "EN";
  if (locale === "JA") return "JA";
  return "KO";
}

function buildCareerSlug(company: string, position: string, id: string) {
  const base = `${company}-${position}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "career"}-${id.slice(0, 8)}`;
}

const GRAPHQL_CACHE_PREFIX = "admin:gql";
const GRAPHQL_QUERY_CACHE_TTL_SECONDS = Number(process.env.GRAPHQL_QUERY_CACHE_TTL_SECONDS ?? "60");

type CacheableSession = {
  user: {
    id: string;
    role: "ADMIN" | "USER";
  };
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, current]) => `${JSON.stringify(key)}:${stableStringify(current)}`)
    .join(",")}}`;
}

function buildQueryCacheKey(
  namespace: string,
  session: CacheableSession | null,
  args: Record<string, unknown>,
) {
  const scope = session?.user.role === "ADMIN" ? "admin" : (session?.user.id ?? "anonymous");
  return `${GRAPHQL_CACHE_PREFIX}:query:${namespace}:${scope}:${stableStringify(args)}`;
}

async function getCachedQueryResult<T>(
  namespace: string,
  session: CacheableSession | null,
  args: Record<string, unknown>,
  resolver: () => Promise<T>,
): Promise<T> {
  const cacheKey = buildQueryCacheKey(namespace, session, args);

  try {
    const redis = await getRedisClient();
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // Cache read failure should not block the request.
    }

    const value = await resolver();

    try {
      await redis.set(cacheKey, JSON.stringify(value), { EX: GRAPHQL_QUERY_CACHE_TTL_SECONDS });
    } catch {
      // Cache write failure should not block the request.
    }

    return value;
  } catch {
    return resolver();
  }
}

async function invalidateQueryCaches(namespaces: string[]) {
  if (namespaces.length === 0) return;

  try {
    const redis = await getRedisClient();
    for (const namespace of namespaces) {
      const pattern = `${GRAPHQL_CACHE_PREFIX}:query:${namespace}:*`;
      let cursor = 0;

      do {
        const reply = await redis.scan(cursor, {
          MATCH: pattern,
          COUNT: 200,
        });
        cursor = reply.cursor;
        if (reply.keys.length > 0) {
          await redis.del(reply.keys);
        }
      } while (cursor !== 0);
    }
  } catch {
    // Ignore cache invalidation errors.
  }
}

async function getNextProjectTranslationId() {
  const result = await prisma.portfolioProjectTranslation.aggregate({
    _max: { id: true },
  });
  return (result._max.id ?? 0) + 1;
}

async function getNextCareerTranslationId() {
  const result = await prisma.portfolioCareerTranslation.aggregate({
    _max: { id: true },
  });
  return (result._max.id ?? 0) + 1;
}

const projectBaseSelect = {
  id: true,
  slug: true,
  displayOrder: true,
  startDate: true,
  endDate: true,
  isOngoing: true,
  isPublished: true,
  links: true,
  createdAt: true,
  updatedAt: true,
} as const;

const careerBaseSelect = {
  id: true,
  company: true,
  position: true,
  overview: true,
  slug: true,
  startDate: true,
  endDate: true,
  isOngoing: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

const typeDefs = /* GraphQL */ `
  enum Role {
    ADMIN
    USER
  }

  enum ProjectLocale {
    EN
    KO
    JA
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum UserSortField {
    CREATED_AT
    USERNAME
    NAME
    EMAIL
    ROLE
  }

  enum ProjectSortField {
    CREATED_AT
    SLUG
    DISPLAY_ORDER
    START_DATE
    END_DATE
    IS_PUBLISHED
  }

  enum CareerSortField {
    CREATED_AT
    COMPANY
    POSITION
    DISPLAY_ORDER
    START_DATE
    END_DATE
    IS_CURRENT
    IS_PUBLISHED
  }

  input ProjectTranslationInput {
    locale: ProjectLocale!
    title: String!
    company: String
    role: String!
    achievements: String!
  }

  input CareerTranslationInput {
    locale: ProjectLocale!
    company: String!
    position: String!
    description: String
  }

  type User {
    id: ID!
    username: String!
    email: String
    name: String
    role: Role!
    createdAt: String!
    updatedAt: String!
  }

  type Project {
    id: ID!
    slug: String!
    title: String
    company: String
    role: String
    achievements: String
    technologies: [String!]!
    displayOrder: Int!
    startDate: String!
    endDate: String
    isOngoing: Boolean!
    isPublished: Boolean!
    links: String
    createdAt: String!
    updatedAt: String!
  }

  type UsersResult {
    items: [User!]!
    totalCount: Int!
  }

  type ProjectsResult {
    items: [Project!]!
    totalCount: Int!
  }

  type Career {
    id: ID!
    company: String!
    position: String!
    description: String
    startDate: String!
    endDate: String
    isCurrent: Boolean!
    displayOrder: Int!
    isPublished: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type CareersResult {
    items: [Career!]!
    totalCount: Int!
  }

  type Query {
    me: User
    user(userId: ID!): User
    users(
      username: String
      name: String
      page: Int
      pageSize: Int
      sortBy: UserSortField
      sortOrder: SortOrder
    ): UsersResult!
    project(projectId: ID!, locale: ProjectLocale): Project
    projects(
      slug: String
      isPublished: Boolean
      locale: ProjectLocale
      page: Int
      pageSize: Int
      sortBy: ProjectSortField
      sortOrder: SortOrder
    ): ProjectsResult!
    career(careerId: ID!, locale: ProjectLocale): Career
    careers(
      company: String
      position: String
      isCurrent: Boolean
      isPublished: Boolean
      locale: ProjectLocale
      page: Int
      pageSize: Int
      sortBy: CareerSortField
      sortOrder: SortOrder
    ): CareersResult!
  }

  type Mutation {
    createUser(
      username: String!
      email: String
      name: String
      password: String!
      role: Role!
    ): User!
    updateUser(
      userId: ID!
      username: String
      email: String
      name: String
      password: String
      role: Role
    ): User!
    updateUserRole(userId: ID!, role: Role!): User!
    deleteUser(userId: ID!): Boolean!

    createProject(
      slug: String!
      displayOrder: Int!
      startDate: String!
      endDate: String
      isOngoing: Boolean!
      isPublished: Boolean!
      links: String
      translations: [ProjectTranslationInput!]!
      technologyNames: [String!]
    ): Project!

    updateProject(
      projectId: ID!
      slug: String
      displayOrder: Int
      startDate: String
      endDate: String
      isOngoing: Boolean
      isPublished: Boolean
      links: String
      translations: [ProjectTranslationInput!]
      technologyNames: [String!]
    ): Project!

    deleteProject(projectId: ID!): Boolean!

    createCareer(
      startDate: String!
      endDate: String
      isCurrent: Boolean!
      displayOrder: Int!
      isPublished: Boolean!
      translations: [CareerTranslationInput!]!
    ): Career!

    updateCareer(
      careerId: ID!
      startDate: String
      endDate: String
      isCurrent: Boolean
      displayOrder: Int
      isPublished: Boolean
      translations: [CareerTranslationInput!]
    ): Career!

    deleteCareer(careerId: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: { session: SessionContext }) => {
      if (!context.session?.user.id) return null;
      return getCachedQueryResult(
        "me",
        context.session,
        { userId: context.session.user.id },
        async () => {
          const user = await prisma.user.findFirst({
            where: { id: context.session?.user.id, deletedAt: null },
          });
          if (!user) return null;
          return {
            ...user,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          };
        },
      );
    },

    users: async (
      _: unknown,
      args: {
        username?: string;
        name?: string;
        page?: number;
        pageSize?: number;
        sortBy?: "CREATED_AT" | "USERNAME" | "NAME" | "EMAIL" | "ROLE";
        sortOrder?: "ASC" | "DESC";
      },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);

      const page = Math.max(1, args.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, args.pageSize ?? 10));
      const sortBy = args.sortBy ?? "CREATED_AT";
      const sortOrder = args.sortOrder ?? "DESC";
      const direction: Prisma.SortOrder = sortOrder === "ASC" ? "asc" : "desc";

      return getCachedQueryResult(
        "users",
        context.session,
        {
          username: args.username?.trim() ?? null,
          name: args.name?.trim() ?? null,
          page,
          pageSize,
          sortBy,
          sortOrder,
        },
        async () => {
          const where = {
            deletedAt: null,
            AND: [
              args.username?.trim()
                ? { username: { contains: args.username.trim(), mode: "insensitive" as const } }
                : {},
              args.name?.trim()
                ? { name: { contains: args.name.trim(), mode: "insensitive" as const } }
                : {},
            ],
          };

          const orderBy: Prisma.UserOrderByWithRelationInput =
            sortBy === "USERNAME"
              ? { username: direction }
              : sortBy === "NAME"
                ? { name: direction }
                : sortBy === "EMAIL"
                  ? { email: direction }
                  : sortBy === "ROLE"
                    ? { role: direction }
                    : { createdAt: direction };

          const [totalCount, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
              where,
              orderBy,
              skip: (page - 1) * pageSize,
              take: pageSize,
            }),
          ]);

          return {
            totalCount,
            items: users.map((user) => ({
              ...user,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString(),
            })),
          };
        },
      );
    },

    user: async (_: unknown, args: { userId: string }, context: { session: SessionContext }) => {
      assertAdmin(context.session);
      return getCachedQueryResult("user", context.session, { userId: args.userId }, async () => {
        const user = await prisma.user.findFirst({ where: { id: args.userId, deletedAt: null } });
        if (!user) return null;
        return {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      });
    },

    project: async (
      _: unknown,
      args: { projectId: string; locale?: ProjectLocale },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);
      const locale = mapProjectLocale(args.locale);

      return getCachedQueryResult(
        "project",
        context.session,
        { projectId: args.projectId, locale },
        async () => {
          const project = await prisma.portfolioProject.findFirst({
            where: { id: args.projectId },
            select: {
              ...projectBaseSelect,
              translations: true,
              technologies: {
                select: {
                  displayOrder: true,
                  technology: {
                    select: { name: true },
                  },
                },
                orderBy: { displayOrder: "asc" },
              },
            },
          });

          if (!project) return null;

          const translation =
            project.translations.find((t) => t.locale === locale) ??
            project.translations[0] ??
            null;

          return {
            id: project.id,
            slug: project.slug,
            title: translation?.title ?? null,
            company: translation?.company ?? null,
            role: translation?.role ?? null,
            achievements: translation?.achievements
              ? JSON.stringify(translation.achievements)
              : "[]",
            technologies: project.technologies.map((t) => t.technology.name),
            displayOrder: project.displayOrder,
            startDate: project.startDate.toISOString(),
            endDate: project.endDate?.toISOString() ?? null,
            isOngoing: project.isOngoing,
            isPublished: project.isPublished,
            links: project.links ? JSON.stringify(project.links) : null,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
          };
        },
      );
    },

    projects: async (
      _: unknown,
      args: {
        slug?: string;
        isPublished?: boolean;
        locale?: ProjectLocale;
        page?: number;
        pageSize?: number;
        sortBy?:
          | "CREATED_AT"
          | "SLUG"
          | "DISPLAY_ORDER"
          | "START_DATE"
          | "END_DATE"
          | "IS_PUBLISHED";
        sortOrder?: "ASC" | "DESC";
      },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);

      const page = Math.max(1, args.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, args.pageSize ?? 10));
      const locale = mapProjectLocale(args.locale);
      const sortBy = args.sortBy ?? "DISPLAY_ORDER";
      const sortOrder = args.sortOrder ?? "ASC";
      const direction: Prisma.SortOrder = sortOrder === "ASC" ? "asc" : "desc";

      return getCachedQueryResult(
        "projects",
        context.session,
        {
          slug: args.slug?.trim() ?? null,
          isPublished: typeof args.isPublished === "boolean" ? args.isPublished : null,
          locale,
          page,
          pageSize,
          sortBy,
          sortOrder,
        },
        async () => {
          const where = {
            AND: [
              args.slug?.trim()
                ? { slug: { contains: args.slug.trim(), mode: "insensitive" as const } }
                : {},
              typeof args.isPublished === "boolean" ? { isPublished: args.isPublished } : {},
            ],
          };

          const orderBy: Prisma.PortfolioProjectOrderByWithRelationInput[] =
            sortBy === "SLUG"
              ? [{ slug: direction }, { createdAt: "desc" }]
              : sortBy === "DISPLAY_ORDER"
                ? [{ displayOrder: direction }, { createdAt: "desc" }]
                : sortBy === "START_DATE"
                  ? [{ startDate: direction }, { createdAt: "desc" }]
                  : sortBy === "END_DATE"
                    ? [{ endDate: direction }, { createdAt: "desc" }]
                    : sortBy === "IS_PUBLISHED"
                      ? [{ isPublished: direction }, { createdAt: "desc" }]
                      : [{ createdAt: direction }];

          const [totalCount, projects] = await Promise.all([
            prisma.portfolioProject.count({ where }),
            prisma.portfolioProject.findMany({
              where,
              select: {
                ...projectBaseSelect,
                translations: true,
                technologies: {
                  select: {
                    displayOrder: true,
                    technology: {
                      select: { name: true },
                    },
                  },
                  orderBy: { displayOrder: "asc" },
                },
              },
              orderBy,
              skip: (page - 1) * pageSize,
              take: pageSize,
            }),
          ]);

          return {
            totalCount,
            items: projects.map((project) => {
              const translation =
                project.translations.find((t) => t.locale === locale) ??
                project.translations[0] ??
                null;

              return {
                id: project.id,
                slug: project.slug,
                title: translation?.title ?? null,
                company: translation?.company ?? null,
                role: translation?.role ?? null,
                achievements: translation?.achievements
                  ? JSON.stringify(translation.achievements)
                  : "[]",
                technologies: project.technologies.map((t) => t.technology.name),
                displayOrder: project.displayOrder,
                startDate: project.startDate.toISOString(),
                endDate: project.endDate?.toISOString() ?? null,
                isOngoing: project.isOngoing,
                isPublished: project.isPublished,
                links: project.links ? JSON.stringify(project.links) : null,
                createdAt: project.createdAt.toISOString(),
                updatedAt: project.updatedAt.toISOString(),
              };
            }),
          };
        },
      );
    },

    career: async (
      _: unknown,
      args: { careerId: string; locale?: ProjectLocale },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);
      const locale = mapProjectLocale(args.locale);
      return getCachedQueryResult(
        "career",
        context.session,
        { careerId: args.careerId, locale },
        async () => {
          const careerDelegate = (
            prisma as unknown as { portfolioCareer?: typeof prisma.portfolioCareer }
          ).portfolioCareer;

          const career = careerDelegate
            ? await careerDelegate.findFirst({
                where: { id: args.careerId },
                select: {
                  ...careerBaseSelect,
                  translations: true,
                },
              })
            : null;
          if (!career) return null;

          return mapCareerRecord(career, locale);
        },
      );
    },

    careers: async (
      _: unknown,
      args: {
        company?: string;
        position?: string;
        isCurrent?: boolean;
        isPublished?: boolean;
        locale?: ProjectLocale;
        page?: number;
        pageSize?: number;
        sortBy?: CareerSortField;
        sortOrder?: "ASC" | "DESC";
      },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);

      const page = Math.max(1, args.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, args.pageSize ?? 10));
      const sortBy = args.sortBy ?? "DISPLAY_ORDER";
      const sortOrder = args.sortOrder ?? "ASC";
      const direction: Prisma.SortOrder = sortOrder === "ASC" ? "asc" : "desc";
      const locale = mapProjectLocale(args.locale);

      return getCachedQueryResult(
        "careers",
        context.session,
        {
          company: args.company?.trim() ?? null,
          position: args.position?.trim() ?? null,
          isCurrent: typeof args.isCurrent === "boolean" ? args.isCurrent : null,
          isPublished: typeof args.isPublished === "boolean" ? args.isPublished : null,
          locale,
          page,
          pageSize,
          sortBy,
          sortOrder,
        },
        async () => {
          if (args.isPublished === false) {
            return { totalCount: 0, items: [] };
          }

          const careerDelegate = (
            prisma as unknown as {
              portfolioCareer?: typeof prisma.portfolioCareer;
            }
          ).portfolioCareer;
          if (!careerDelegate) {
            const conditions: Prisma.Sql[] = [Prisma.sql`(to_jsonb(c)->>'deletedAt') IS NULL`];

            if (args.company?.trim()) {
              conditions.push(
                Prisma.sql`COALESCE(to_jsonb(tl)->>'company', tf."company", '') ILIKE ${`%${args.company.trim()}%`}`,
              );
            }
            if (args.position?.trim()) {
              conditions.push(
                Prisma.sql`COALESCE(to_jsonb(tl)->>'position', tf."position", '') ILIKE ${`%${args.position.trim()}%`}`,
              );
            }
            if (typeof args.isCurrent === "boolean") {
              conditions.push(
                Prisma.sql`COALESCE(
              NULLIF(to_jsonb(c)->>'isCurrent', '')::boolean,
              NULLIF(to_jsonb(c)->>'isOngoing', '')::boolean,
              false
            ) = ${args.isCurrent}`,
              );
            }
            if (typeof args.isPublished === "boolean") {
              conditions.push(
                Prisma.sql`COALESCE(
              NULLIF(to_jsonb(c)->>'isPublished', '')::boolean,
              true
            ) = ${args.isPublished}`,
              );
            }

            const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
            const rows = await prisma.$queryRaw<
              Array<{
                id: string;
                startDate: Date;
                endDate: Date | null;
                isCurrent: boolean;
                isPublished: boolean;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
                company: string;
                position: string;
                description: string | null;
              }>
            >(
              Prisma.sql`
            SELECT
              c."id",
              c."startDate",
              c."endDate",
              c."displayOrder",
              c."createdAt",
              c."updatedAt",
              COALESCE(
                NULLIF(to_jsonb(c)->>'isCurrent', '')::boolean,
                NULLIF(to_jsonb(c)->>'isOngoing', '')::boolean,
                false
              ) AS "isCurrent",
              COALESCE(
                NULLIF(to_jsonb(c)->>'isPublished', '')::boolean,
                true
              ) AS "isPublished",
              COALESCE(
                to_jsonb(tl)->>'company',
                tf."company",
                ''
              ) AS "company",
              COALESCE(
                to_jsonb(tl)->>'position',
                tf."position",
                ''
              ) AS "position",
              COALESCE(
                to_jsonb(tl)->>'description',
                tf."description"
              ) AS "description"
            FROM "Career" c
            LEFT JOIN "CareerTranslation" tl
              ON tl."careerId" = c."id"
             AND tl."locale"::text = ${locale}
            LEFT JOIN LATERAL (
              SELECT
                COALESCE(to_jsonb(t)->>'company', '') AS "company",
                COALESCE(to_jsonb(t)->>'position', '') AS "position",
                to_jsonb(t)->>'description' AS "description"
              FROM "CareerTranslation" t
              WHERE t."careerId" = c."id"
              ORDER BY t."id" ASC
              LIMIT 1
            ) tf ON TRUE
            ${whereSql}
          `,
            );

            const sorted = rows
              .map((row) => ({
                id: row.id,
                company: row.company,
                position: row.position,
                description: row.description,
                startDate: row.startDate.toISOString(),
                endDate: row.endDate?.toISOString() ?? null,
                isCurrent: row.isCurrent,
                isPublished: row.isPublished,
                displayOrder: row.displayOrder,
                createdAt: row.createdAt.toISOString(),
                updatedAt: row.updatedAt.toISOString(),
              }))
              .sort((a, b) => {
                const strCompare = (left: string, right: string) => left.localeCompare(right);
                const numCompare = (left: number, right: number) => left - right;
                const boolCompare = (left: boolean, right: boolean) => Number(left) - Number(right);
                const dateCompare = (left: string, right: string) =>
                  new Date(left).getTime() - new Date(right).getTime();

                const base =
                  sortBy === "COMPANY"
                    ? strCompare(a.company, b.company)
                    : sortBy === "POSITION"
                      ? strCompare(a.position, b.position)
                      : sortBy === "DISPLAY_ORDER"
                        ? numCompare(a.displayOrder, b.displayOrder)
                        : sortBy === "START_DATE"
                          ? dateCompare(a.startDate, b.startDate)
                          : sortBy === "END_DATE"
                            ? dateCompare(a.endDate ?? "", b.endDate ?? "")
                            : sortBy === "IS_CURRENT"
                              ? boolCompare(a.isCurrent, b.isCurrent)
                              : sortBy === "IS_PUBLISHED"
                                ? boolCompare(a.isPublished, b.isPublished)
                                : dateCompare(a.createdAt, b.createdAt);

                if (base !== 0) return direction === "asc" ? base : -base;
                return dateCompare(b.createdAt, a.createdAt);
              });

            const start = (page - 1) * pageSize;
            return {
              totalCount: sorted.length,
              items: sorted.slice(start, start + pageSize),
            };
          }
          const where: Prisma.PortfolioCareerWhereInput = {
            AND: [
              args.company?.trim()
                ? {
                    OR: [
                      { company: { contains: args.company.trim(), mode: "insensitive" } },
                      {
                        translations: {
                          some: {
                            locale,
                            company: { contains: args.company.trim(), mode: "insensitive" },
                          },
                        },
                      },
                    ],
                  }
                : {},
              args.position?.trim()
                ? {
                    OR: [
                      { position: { contains: args.position.trim(), mode: "insensitive" } },
                      {
                        translations: {
                          some: {
                            locale,
                            position: { contains: args.position.trim(), mode: "insensitive" },
                          },
                        },
                      },
                    ],
                  }
                : {},
              typeof args.isCurrent === "boolean" ? { isOngoing: args.isCurrent } : {},
            ],
          };

          const defaultOrderBy: Prisma.PortfolioCareerOrderByWithRelationInput[] =
            sortBy === "DISPLAY_ORDER"
              ? [{ displayOrder: direction }, { createdAt: "desc" }]
              : sortBy === "START_DATE"
                ? [{ startDate: direction }, { createdAt: "desc" }]
                : sortBy === "END_DATE"
                  ? [{ endDate: direction }, { createdAt: "desc" }]
                  : sortBy === "IS_CURRENT"
                    ? [{ isOngoing: direction }, { createdAt: "desc" }]
                    : sortBy === "IS_PUBLISHED"
                      ? [{ createdAt: "desc" }]
                      : [{ createdAt: direction }];

          const shouldSortByTranslation = sortBy === "COMPANY" || sortBy === "POSITION";

          if (shouldSortByTranslation) {
            const [totalCount, rows] = await Promise.all([
              careerDelegate.count({ where }),
              careerDelegate.findMany({
                where,
                select: {
                  ...careerBaseSelect,
                  translations: true,
                },
              }),
            ]);

            const sorted = rows.sort((a, b) => {
              const left = mapCareerRecord(a, locale);
              const right = mapCareerRecord(b, locale);
              const leftValue = sortBy === "COMPANY" ? left.company : left.position;
              const rightValue = sortBy === "COMPANY" ? right.company : right.position;
              const compared = leftValue.localeCompare(rightValue);
              if (compared !== 0) {
                return direction === "asc" ? compared : -compared;
              }
              return right.createdAt.localeCompare(left.createdAt);
            });

            const start = (page - 1) * pageSize;
            const items = sorted
              .slice(start, start + pageSize)
              .map((row) => mapCareerRecord(row, locale));

            return {
              totalCount,
              items,
            };
          }

          const [totalCount, careers] = await Promise.all([
            careerDelegate.count({ where }),
            careerDelegate.findMany({
              where,
              select: {
                ...careerBaseSelect,
                translations: true,
              },
              orderBy: defaultOrderBy,
              skip: (page - 1) * pageSize,
              take: pageSize,
            }),
          ]);
          return {
            totalCount,
            items: careers.map((career) => mapCareerRecord(career, locale)),
          };
        },
      );
    },
  },

  Mutation: {
    createUser: async (
      _: unknown,
      args: { username: string; email?: string; name?: string; password: string; role: Role },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);

      const { hash } = await import("bcryptjs");
      const passwordHash = await hash(args.password, 12);

      let user;
      try {
        user = await prisma.user.create({
          data: {
            id: createId(),
            username: args.username.trim(),
            email: args.email?.trim() || null,
            name: args.name?.trim() || null,
            passwordHash,
            role: args.role,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
          if (target.includes("username")) {
            throw new Error("USERNAME_ALREADY_EXISTS");
          }
          if (target.includes("email")) {
            throw new Error("EMAIL_ALREADY_EXISTS");
          }
          throw new Error("USER_ALREADY_EXISTS");
        }
        throw error;
      }

      try {
        await syncMailUser({
          action: "CREATE",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            password: args.password,
            role: user.role,
          },
        });
      } catch (error) {
        if (isMailSyncRequired()) {
          await prisma.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } });
          throw new Error(
            error instanceof Error && error.message
              ? `MAIL_SYNC_FAILED:${error.message}`
              : "MAIL_SYNC_FAILED",
          );
        }
      }

      await invalidateQueryCaches(["me", "user", "users"]);
      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    },

    updateUser: async (
      _: unknown,
      args: {
        userId: string;
        username?: string;
        email?: string;
        name?: string;
        password?: string;
        role?: Role;
      },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);

      const existingUser = await prisma.user.findFirst({
        where: { id: args.userId, deletedAt: null },
      });
      if (!existingUser) throw new Error("USER_NOT_FOUND");

      const data: {
        username?: string;
        email?: string | null;
        name?: string | null;
        role?: Role;
        passwordHash?: string;
      } = {};

      if (typeof args.username === "string") data.username = args.username.trim();
      if (typeof args.email === "string") data.email = args.email.trim() || null;
      if (args.email === null) data.email = null;
      if (typeof args.name === "string") data.name = args.name.trim() || null;
      if (args.name === null) data.name = null;
      if (args.role) data.role = args.role;
      if (typeof args.password === "string" && args.password.trim()) {
        const { hash } = await import("bcryptjs");
        data.passwordHash = await hash(args.password, 12);
      }
      const nextPassword = typeof args.password === "string" ? args.password.trim() : "";

      const user = await prisma.user.update({ where: { id: args.userId }, data });

      await syncMailUser({
        action: "UPDATE",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          password: nextPassword || undefined,
          role: user.role,
        },
      }).catch((error) => {
        if (isMailSyncRequired()) throw error;
      });

      await invalidateQueryCaches(["me", "user", "users"]);
      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    },

    updateUserRole: async (
      _: unknown,
      args: { userId: string; role: Role },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);
      if (context.session?.user.id === args.userId && args.role !== Role.ADMIN) {
        throw new Error("You cannot remove your own admin role.");
      }

      const existingUser = await prisma.user.findFirst({
        where: { id: args.userId, deletedAt: null },
      });
      if (!existingUser) throw new Error("USER_NOT_FOUND");

      const user = await prisma.user.update({
        where: { id: args.userId },
        data: { role: args.role },
      });

      await syncMailUser({
        action: "UPDATE",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }).catch((error) => {
        if (isMailSyncRequired()) throw error;
      });

      await invalidateQueryCaches(["me", "user", "users"]);
      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    },

    deleteUser: async (
      _: unknown,
      args: { userId: string },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);
      if (context.session?.user.id === args.userId) {
        throw new Error("You cannot delete your own account.");
      }

      const user = await prisma.user.findFirst({
        where: { id: args.userId, deletedAt: null },
      });
      if (!user) {
        return true;
      }

      await prisma.user.update({
        where: { id: args.userId },
        data: { deletedAt: new Date() },
      });

      await syncMailUser({
        action: "DELETE",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }).catch((error) => {
        if (isMailSyncRequired()) throw error;
      });

      await invalidateQueryCaches(["me", "user", "users"]);
      return true;
    },

    createProject: async (
      _: unknown,
      args: {
        slug: string;
        displayOrder: number;
        startDate: string;
        endDate?: string;
        isOngoing: boolean;
        isPublished: boolean;
        links?: string;
        translations: Array<{
          locale: ProjectLocale;
          title: string;
          company?: string | null;
          role: string;
          achievements: string;
        }>;
        technologyNames?: string[];
      },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);

      const projectId = createId();

      const project = await prisma.portfolioProject.create({
        data: {
          id: projectId,
          slug: args.slug.trim(),
          displayOrder: args.displayOrder,
          startDate: parseDateOrThrow(args.startDate, "startDate"),
          endDate: args.endDate?.trim() ? parseDateOrThrow(args.endDate, "endDate") : null,
          isOngoing: args.isOngoing,
          isPublished: args.isPublished,
          links: parseLinks(args.links),
        },
        select: projectBaseSelect,
      });

      for (const tr of args.translations) {
        const translationId = await getNextProjectTranslationId();
        await prisma.portfolioProjectTranslation.create({
          data: {
            id: translationId,
            projectId,
            locale: tr.locale,
            title: tr.title.trim(),
            company: tr.company?.trim() || null,
            role: tr.role.trim(),
            achievements: parseAchievements(tr.achievements),
          },
        });
      }

      const technologyNames = (args.technologyNames ?? [])
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      for (const [index, technologyName] of technologyNames.entries()) {
        const technology = await prisma.portfolioTechnology.upsert({
          where: { name: technologyName },
          update: {},
          create: {
            id: createId(),
            name: technologyName,
          },
        });

        await prisma.portfolioProjectTechnology.create({
          data: {
            projectId,
            technologyId: technology.id,
            displayOrder: index,
          },
        });
      }

      await invalidateQueryCaches(["project", "projects"]);
      return {
        id: project.id,
        slug: project.slug,
        title: null,
        company: null,
        role: null,
        achievements: "[]",
        technologies: technologyNames,
        displayOrder: project.displayOrder,
        startDate: project.startDate.toISOString(),
        endDate: project.endDate?.toISOString() ?? null,
        isOngoing: project.isOngoing,
        isPublished: project.isPublished,
        links: project.links ? JSON.stringify(project.links) : null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      };
    },

    updateProject: async (
      _: unknown,
      args: {
        projectId: string;
        slug?: string;
        displayOrder?: number;
        startDate?: string;
        endDate?: string;
        isOngoing?: boolean;
        isPublished?: boolean;
        links?: string;
        translations?: Array<{
          locale: ProjectLocale;
          title: string;
          company?: string | null;
          role: string;
          achievements: string;
        }>;
        technologyNames?: string[];
      },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);

      const data: {
        slug?: string;
        displayOrder?: number;
        startDate?: Date;
        endDate?: Date | null;
        isOngoing?: boolean;
        isPublished?: boolean;
        links?: Prisma.InputJsonValue | typeof Prisma.DbNull;
        updatedAt: Date;
      } = { updatedAt: new Date() };

      if (typeof args.slug === "string") data.slug = args.slug.trim();
      if (typeof args.displayOrder === "number") data.displayOrder = args.displayOrder;
      if (typeof args.startDate === "string")
        data.startDate = parseDateOrThrow(args.startDate, "startDate");
      if (typeof args.endDate === "string") {
        data.endDate = args.endDate.trim() ? parseDateOrThrow(args.endDate, "endDate") : null;
      }
      if (typeof args.isOngoing === "boolean") data.isOngoing = args.isOngoing;
      if (typeof args.isPublished === "boolean") data.isPublished = args.isPublished;
      if (typeof args.links === "string") data.links = parseLinks(args.links);

      const existingProject = await prisma.portfolioProject.findFirst({
        where: { id: args.projectId },
        select: { id: true },
      });
      if (!existingProject) throw new Error("PROJECT_NOT_FOUND");

      const project = await prisma.portfolioProject.update({
        where: { id: args.projectId },
        data,
        select: projectBaseSelect,
      });

      if (args.translations) {
        for (const tr of args.translations) {
          await prisma.portfolioProjectTranslation.upsert({
            where: {
              projectId_locale: {
                projectId: args.projectId,
                locale: tr.locale,
              },
            },
            update: {
              title: tr.title.trim(),
              company: tr.company?.trim() || null,
              role: tr.role.trim(),
              achievements: parseAchievements(tr.achievements),
            },
            create: {
              id: await getNextProjectTranslationId(),
              projectId: args.projectId,
              locale: tr.locale,
              title: tr.title.trim(),
              company: tr.company?.trim() || null,
              role: tr.role.trim(),
              achievements: parseAchievements(tr.achievements),
            },
          });
        }
      }

      if (args.technologyNames) {
        await prisma.portfolioProjectTechnology.deleteMany({
          where: { projectId: args.projectId },
        });

        const technologyNames = args.technologyNames
          .map((name) => name.trim())
          .filter((name) => name.length > 0);

        for (const [index, technologyName] of technologyNames.entries()) {
          const technology = await prisma.portfolioTechnology.upsert({
            where: { name: technologyName },
            update: {},
            create: {
              id: createId(),
              name: technologyName,
            },
          });

          await prisma.portfolioProjectTechnology.create({
            data: {
              projectId: args.projectId,
              technologyId: technology.id,
              displayOrder: index,
            },
          });
        }
      }

      await invalidateQueryCaches(["project", "projects"]);
      return {
        id: project.id,
        slug: project.slug,
        title: null,
        company: null,
        role: null,
        achievements: "[]",
        technologies: [],
        displayOrder: project.displayOrder,
        startDate: project.startDate.toISOString(),
        endDate: project.endDate?.toISOString() ?? null,
        isOngoing: project.isOngoing,
        isPublished: project.isPublished,
        links: project.links ? JSON.stringify(project.links) : null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      };
    },

    deleteProject: async (
      _: unknown,
      args: { projectId: string },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);
      const project = await prisma.portfolioProject.findFirst({
        where: { id: args.projectId },
        select: { id: true },
      });
      if (!project) {
        return true;
      }

      await prisma.portfolioProject.delete({
        where: { id: args.projectId },
      });
      await invalidateQueryCaches(["project", "projects"]);
      return true;
    },

    createCareer: async (
      _: unknown,
      args: {
        startDate: string;
        endDate?: string;
        isCurrent: boolean;
        displayOrder: number;
        isPublished: boolean;
        translations: Array<{
          locale: ProjectLocale;
          company: string;
          position: string;
          description?: string | null;
        }>;
      },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);
      const careerId = createId();
      const koTranslation =
        args.translations.find((translation) => translation.locale === "KO") ??
        args.translations[0];
      const baseCompany = koTranslation?.company?.trim() || "career";
      const basePosition = koTranslation?.position?.trim() || "position";
      const baseOverview = koTranslation?.description?.trim() || null;
      const startDate = parseDateOrThrow(args.startDate, "startDate");
      const endDate = args.endDate?.trim() ? parseDateOrThrow(args.endDate, "endDate") : null;
      const career = await prisma.portfolioCareer.create({
        data: {
          id: careerId,
          company: baseCompany,
          position: basePosition,
          overview: baseOverview,
          slug: buildCareerSlug(baseCompany, basePosition, careerId),
          startDate,
          endDate,
          isOngoing: args.isCurrent,
          displayOrder: args.displayOrder,
        },
        select: {
          ...careerBaseSelect,
          translations: true,
        },
      });

      for (const tr of args.translations) {
        await prisma.portfolioCareerTranslation.create({
          data: {
            id: await getNextCareerTranslationId(),
            careerId,
            locale: tr.locale,
            company: tr.company.trim(),
            position: tr.position.trim(),
            overview: tr.description?.trim() || null,
          },
        });
      }

      if (!career) {
        throw new Error("CAREER_CREATE_FAILED");
      }

      const careerWithTranslations = await prisma.portfolioCareer.findFirst({
        where: { id: careerId },
        select: {
          ...careerBaseSelect,
          translations: true,
        },
      });

      if (!careerWithTranslations) {
        throw new Error("CAREER_CREATE_FAILED");
      }

      await invalidateQueryCaches(["career", "careers"]);
      return mapCareerRecord(careerWithTranslations, "KO");
    },

    updateCareer: async (
      _: unknown,
      args: {
        careerId: string;
        startDate?: string;
        endDate?: string;
        isCurrent?: boolean;
        displayOrder?: number;
        isPublished?: boolean;
        translations?: Array<{
          locale: ProjectLocale;
          company: string;
          position: string;
          description?: string | null;
        }>;
      },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);
      const existingCareer = await prisma.portfolioCareer.findFirst({
        where: { id: args.careerId },
        select: { id: true, company: true, position: true },
      });
      if (!existingCareer) throw new Error("CAREER_NOT_FOUND");

      const data: {
        startDate?: Date;
        endDate?: Date | null;
        isOngoing?: boolean;
        displayOrder?: number;
        company?: string;
        position?: string;
        overview?: string | null;
        slug?: string;
        updatedAt: Date;
      } = { updatedAt: new Date() };

      if (typeof args.startDate === "string") {
        data.startDate = parseDateOrThrow(args.startDate, "startDate");
      }
      if (typeof args.endDate === "string") {
        data.endDate = args.endDate.trim() ? parseDateOrThrow(args.endDate, "endDate") : null;
      }
      if (typeof args.isCurrent === "boolean") data.isOngoing = args.isCurrent;
      if (typeof args.displayOrder === "number") data.displayOrder = args.displayOrder;
      const koTranslation =
        args.translations?.find((translation) => translation.locale === "KO") ??
        args.translations?.[0];
      if (koTranslation) {
        data.company = koTranslation.company.trim();
        data.position = koTranslation.position.trim();
        data.overview = koTranslation.description?.trim() || null;
        data.slug = buildCareerSlug(data.company, data.position, args.careerId);
      }

      await prisma.portfolioCareer.update({
        where: { id: args.careerId },
        data,
      });

      if (args.translations) {
        for (const tr of args.translations) {
          await prisma.portfolioCareerTranslation.upsert({
            where: {
              careerId_locale: {
                careerId: args.careerId,
                locale: tr.locale,
              },
            },
            update: {
              company: tr.company.trim(),
              position: tr.position.trim(),
              overview: tr.description?.trim() || null,
            },
            create: {
              id: await getNextCareerTranslationId(),
              careerId: args.careerId,
              locale: tr.locale,
              company: tr.company.trim(),
              position: tr.position.trim(),
              overview: tr.description?.trim() || null,
            },
          });
        }
      }

      const career = await prisma.portfolioCareer.findFirst({
        where: { id: args.careerId },
        select: {
          ...careerBaseSelect,
          translations: true,
        },
      });

      if (!career) throw new Error("CAREER_NOT_FOUND");
      await invalidateQueryCaches(["career", "careers"]);
      return mapCareerRecord(career, "KO");
    },

    deleteCareer: async (
      _: unknown,
      args: { careerId: string },
      context: { session: SessionContext },
    ) => {
      assertAdmin(context.session);
      const career = await prisma.portfolioCareer.findFirst({
        where: { id: args.careerId },
        select: { id: true },
      });
      if (!career) return true;

      await prisma.portfolioCareer.delete({
        where: { id: args.careerId },
      });
      await invalidateQueryCaches(["career", "careers"]);
      return true;
    },
  },
};

const schema = createSchema({ typeDefs, resolvers });

const yoga = createYoga({
  graphqlEndpoint: "/api/graphql",
  schema,
  maskedErrors: false,
  context: async () => {
    const session = (await getServerSession(authOptions)) as SessionContext;
    return { session };
  },
});

async function requireAdminApiSession() {
  const session = (await getServerSession(authOptions)) as SessionContext;
  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }
  return null;
}

export async function GET(request: Request) {
  const unauthorizedResponse = await requireAdminApiSession();
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }
  return yoga.fetch(request);
}

export async function POST(request: Request) {
  const unauthorizedResponse = await requireAdminApiSession();
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }
  return yoga.fetch(request);
}
