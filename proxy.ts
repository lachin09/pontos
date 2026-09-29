import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "@/lib/i18n/config";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

const ONE_YEAR = 60 * 60 * 24 * 365;

function remember(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  return response;
}

/**
 * Storefront languages: Ukrainian at the plain URLs, Russian and English
 * under /ru and /en. Every storefront route lives in app/[lang], so plain
 * URLs are rewritten to /uk/…. A visitor's first plain-URL visit follows the
 * browser language; after that the last language they chose sticks.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return refreshSupabaseSession(request);
  }

  const [, first, ...rest] = pathname.split("/");
  const restPath = `/${rest.join("/")}`;

  // /uk/… is the switcher's way back to Ukrainian: remember it, drop the prefix.
  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = restPath;
    return remember(NextResponse.redirect(url), DEFAULT_LOCALE);
  }

  if (isLocale(first)) {
    const response = NextResponse.next();
    return request.cookies.get(LOCALE_COOKIE)?.value === first
      ? response
      : remember(response, first);
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferred = isLocale(saved)
    ? saved
    : localeFromAcceptLanguage(request.headers.get("accept-language"));
  if (preferred !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${preferred}` : `/${preferred}${pathname}`;
    return remember(NextResponse.redirect(url), preferred);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension
  // (images, favicon, robots.txt…).
  matcher: ["/((?!api/|_next/|_vercel/|.*\\.[\\w]+$).*)"],
};
