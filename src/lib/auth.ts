import { compare } from "bcryptjs";
import { randomUUID } from "crypto";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { type JWT } from "next-auth/jwt";

import {
  deleteSessionRefreshToken,
  getSessionRecord,
  saveSessionRefreshToken,
  touchSessionLastSeen,
} from "@/lib/auth-session-store";
import { prisma } from "@/lib/prisma";

const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 60 * 15);
const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 7);

function createAccessTokenExpiresAt() {
  return Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000;
}

function createRefreshTokenExpiresAt() {
  return Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000;
}

function readHeaderValue(headers: unknown, key: string): string | null {
  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get(key);
  }

  if (typeof headers === "object" && headers !== null) {
    const value = (headers as Record<string, string | string[] | undefined>)[key];
    if (typeof value === "string") {
      return value;
    }
    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
  }

  return null;
}

function extractClientIp(headers: unknown): string | null {
  const forwarded = readHeaderValue(headers, "x-forwarded-for");
  if (forwarded) {
    const candidate = forwarded.split(",")[0]?.trim();
    if (candidate) {
      return candidate;
    }
  }

  const realIp = readHeaderValue(headers, "x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  const cfIp = readHeaderValue(headers, "cf-connecting-ip");
  if (cfIp?.trim()) {
    return cfIp.trim();
  }

  return null;
}

function extractUserAgent(headers: unknown): string | null {
  const userAgent = readHeaderValue(headers, "user-agent");
  return userAgent?.trim() || null;
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.sub || !token.sessionId) {
    return { ...token, error: "InvalidRefreshToken" };
  }

  if (!token.refreshToken || !token.refreshTokenExpires) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  if (Date.now() >= token.refreshTokenExpires) {
    try {
      await deleteSessionRefreshToken(token.sub, token.sessionId);
    } catch {
      // Ignore cleanup failures for already expired refresh tokens.
    }
    return { ...token, error: "RefreshTokenExpired" };
  }

  let sessionRecord: Awaited<ReturnType<typeof getSessionRecord>> = null;
  try {
    sessionRecord = await getSessionRecord(token.sub, token.sessionId);
  } catch {
    return { ...token, error: "RedisSessionError" };
  }

  if (!sessionRecord || sessionRecord.refreshToken !== token.refreshToken) {
    return { ...token, error: "InvalidRefreshToken" };
  }

  const now = Date.now();
  const nextRefreshToken = randomUUID();
  const nextRefreshTokenExpires = createRefreshTokenExpiresAt();

  try {
    await saveSessionRefreshToken({
      userId: token.sub,
      sessionId: token.sessionId,
      refreshToken: nextRefreshToken,
      refreshTokenExpiresAt: nextRefreshTokenExpires,
      issuedAt: sessionRecord.issuedAt,
      lastSeenAt: now,
      lastIp: sessionRecord.lastIp,
      userAgent: sessionRecord.userAgent,
    });
  } catch {
    return { ...token, error: "RedisSessionError" };
  }

  return {
    ...token,
    accessToken: randomUUID(),
    accessTokenExpires: createAccessTokenExpiresAt(),
    refreshToken: nextRefreshToken,
    refreshTokenExpires: nextRefreshTokenExpires,
    error: undefined,
  };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "ID or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const identifier = credentials?.username?.trim();
        const password = credentials?.password;

        if (!identifier || !password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: identifier },
              { email: { equals: identifier, mode: "insensitive" } },
            ],
          },
        });

        if (!user) {
          return null;
        }

        if (user.role !== "ADMIN") {
          return null;
        }

        const isPasswordValid = await compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.username,
          username: user.username,
          role: user.role,
          lastIp: extractClientIp(req?.headers),
          userAgent: extractUserAgent(req?.headers),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const signedInUser = user as { id: string; role: "ADMIN" | "USER"; username: string; lastIp?: string | null; userAgent?: string | null };

        token.sub = token.sub ?? signedInUser.id;
        token.role = signedInUser.role;
        token.username = signedInUser.username;

        token.accessToken = randomUUID();
        token.accessTokenExpires = createAccessTokenExpiresAt();
        token.sessionId = randomUUID();
        token.refreshToken = randomUUID();
        token.refreshTokenExpires = createRefreshTokenExpiresAt();
        const now = Date.now();

        if (!token.sub || !token.sessionId) {
          return { ...token, error: "InvalidRefreshToken" };
        }

        try {
          await saveSessionRefreshToken({
            userId: token.sub,
            sessionId: token.sessionId,
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: token.refreshTokenExpires,
            issuedAt: now,
            lastSeenAt: now,
            lastIp: signedInUser.lastIp ?? null,
            userAgent: signedInUser.userAgent ?? null,
          });
          token.error = undefined;
        } catch {
          token.error = "RedisSessionError";
          return token;
        }
      }

      if (token.error) {
        return token;
      }

      if (token.sub && token.sessionId && token.refreshToken) {
        try {
          const sessionRecord = await getSessionRecord(token.sub, token.sessionId);
          if (!sessionRecord || sessionRecord.refreshToken !== token.refreshToken) {
            return { ...token, error: "InvalidRefreshToken" };
          }

          const now = Date.now();
          if (now - sessionRecord.lastSeenAt > 30_000) {
            await touchSessionLastSeen(token.sub, token.sessionId, now);
          }
        } catch {
          return { ...token, error: "RedisSessionError" };
        }
      }

      if (token.accessToken && token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as "ADMIN" | "USER";
        session.user.username = (token.username as string) ?? session.user.name ?? "";
      }

      session.accessToken = token.accessToken;
      session.sessionId = token.sessionId;
      session.error = token.error;

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (!token?.sub || !token.sessionId) {
        return;
      }

      try {
        await deleteSessionRefreshToken(token.sub, token.sessionId);
      } catch {
        // Ignore Redis cleanup errors during sign-out.
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
