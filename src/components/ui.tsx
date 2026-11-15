import { statusTone } from "@/lib/labels";
import type { T } from "@/lib/i18n";
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

/** Schnitt der Bewertungen einer Firma, z. B. „★ 4,8 (12)“. Ohne Bewertung wird nichts gezeigt. */
export async function Stars({ rating }: { rating?: { avg: number; count: number } }) {
  if (!rating) return null;
  const { t, locale } = await getI18n();
  const avg = rating.avg.toFixed(1).replace(".", locale === "en" ? "." : ",");
  return (
    <span className="stars nowrap" title={t("{avg} von 5 Sternen aus {n} Bewertungen", { avg, n: rating.count })}>
      <span aria-hidden="true">★</span> {avg} <span className="muted">({rating.count})</span>
    </span>
  );
}
