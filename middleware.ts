import { NextResponse, type NextRequest } from "next/server";

import { getLocale } from "@/lib/i18n";
import { detectPreferredLocale } from "@/lib/locale-detection";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readCountryCode(request: NextRequest) {
  return (
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country-code")
  );
}

export function middleware(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const rawLocaleCookie = request.cookies.get("locale")?.value;
  const localeCookie = getLocale(rawLocaleCookie);
  const hasValidLocaleCookie = rawLocaleCookie === localeCookie;

  if (hasValidLocaleCookie) {
    return NextResponse.next();
  }

  const detectedLocale = detectPreferredLocale({
    country: readCountryCode(request),
    acceptLanguage: request.headers.get("accept-language"),
  });

  const response = NextResponse.redirect(request.nextUrl);
  response.cookies.set("locale", detectedLocale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
