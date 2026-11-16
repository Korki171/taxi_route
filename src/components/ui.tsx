import { statusTone } from "@/lib/labels";
import type { T } from "@/lib/i18n";
import { RATING_MIN_PUBLIC } from "@/lib/rating-rules";
import { getI18n } from "@/server/i18n";

/** Übersetzt Meldungen aus den Services, auch in der Form "feld: Meldung". */
export function translateMessage(t: T, msg: string) {
  const m = /^([\w.]+): (.+)$/.exec(msg);
  return m && t(msg) === msg ? `${m[1]}: ${t(m[2])}` : t(msg);
}

export function Badge({ status, children }: { status: string; children: React.ReactNode }) {
  return <span className={`badge ${statusTone(status)}`}>{children}</span>;
}

export async function Flash({ searchParams }: { searchParams: { error?: string; ok?: string } }) {
  const { t } = await getI18n();
  return (
    <>
      {searchParams.error && <div className="flash error" role="alert">{translateMessage(t, searchParams.error)}</div>}
      {searchParams.ok && <div className="flash ok" role="status">{translateMessage(t, searchParams.ok)}</div>}
    </>
  );
}

export type SP = Promise<{ error?: string; ok?: string; [k: string]: string | undefined }>;

/** Sternsymbol für Bewertungen (gezeichnet, damit es nicht als Emoji dargestellt wird). */
export function StarMark({ filled = true }: { filled?: boolean }) {
  return (
    <svg className="star-mark" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** Eine Reihe aus fünf Sternen, n davon gefüllt (Bewertungsformular). */
export function StarRow({ n }: { n: number }) {
  return <span className="star-row">{[1, 2, 3, 4, 5].map((i) => <StarMark key={i} filled={i <= n} />)}</span>;
}

/**
 * Ruf einer Firma: Schnitt der sichtbaren Bewertungen ab 3 Bewertungen, z. B. „4,8 (12) · 30 Fahrten“,
 * vorher „Neu“. Stornos und No-Shows stehen hier bewusst nicht.
 */
export async function Stars({ rating }: { rating?: { avg: number; count: number; rides: number } }) {
  if (!rating) return null;
  const { t, locale } = await getI18n();
  const rides = rating.rides > 0 ? <> · {t(rating.rides === 1 ? "1 Fahrt" : "{n} Fahrten", { n: rating.rides })}</> : null;
  if (rating.count < RATING_MIN_PUBLIC) {
    return <span className="stars stars-new">{t("Neu, noch wenig Bewertungen")}{rides}</span>;
  }
  const avg = rating.avg.toFixed(1).replace(".", locale === "en" ? "." : ",");
  return (
    <span className="stars" title={t("{avg} von 5 Sternen aus {n} Bewertungen", { avg, n: rating.count })}>
      <StarMark /> <b>{avg}</b> <span className="muted">({rating.count}){rides}</span>
    </span>
  );
}
