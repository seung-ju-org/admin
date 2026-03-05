import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "ADMIN" | "USER";
    } & DefaultSession["user"];
    accessToken?: string;
    sessionId?: string;
    error?:
      | "RefreshAccessTokenError"
      | "RefreshTokenExpired"
      | "InvalidRefreshToken"
      | "RedisSessionError";
  }

  interface User {
    role: "ADMIN" | "USER";
    username: string;
    lastIp?: string | null;
    userAgent?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "USER";
    username?: string;
    accessToken?: string;
    sessionId?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    refreshTokenExpires?: number;
    error?:
      | "RefreshAccessTokenError"
      | "RefreshTokenExpired"
      | "InvalidRefreshToken"
      | "RedisSessionError";
  }
}

export {};
