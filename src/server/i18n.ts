import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { fmtDate, fmtDateTime, fmtMinutes, fmtTime } from "@/lib/format";
import { LOCALE_COOKIE, makeT, pickLocale, type Locale } from "@/lib/i18n";
import { formatCents } from "@/lib/money";

/** Sprache und Formatierer für die aktuelle Anfrage (einmal je Request ermittelt). */
export const getI18n = cache(async () => {
  const locale: Locale = pickLocale((await cookies()).get(LOCALE_COOKIE)?.value, (await headers()).get("accept-language"));
  const t = makeT(locale);
  return {
    locale,
    t,
    f: {
      dateTime: (x: Date | null | undefined) => fmtDateTime(x, locale),
      date: (x: Date | null | undefined) => fmtDate(x, locale),
      time: (x: Date | null | undefined) => fmtTime(x, locale),
      money: (c: number | null | undefined) => formatCents(c, locale),
      minutes: (m: number | null | undefined) => fmtMinutes(m),
    },
  };
});
