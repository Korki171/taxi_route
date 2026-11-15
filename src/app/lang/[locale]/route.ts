import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n";
import { safeInternalPath } from "@/lib/safe-path";

/** Sprache umschalten: /lang/en?next=/boerse */
export async function GET(req: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const target = safeInternalPath(req.nextUrl.searchParams.get("next"));
  const res = NextResponse.redirect(new URL(target, req.url));
  if (LOCALES.includes(locale as Locale)) {
    res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return res;
}
