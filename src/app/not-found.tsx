import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { getI18n } from "@/server/i18n";
import { getActor } from "@/server/web";

/** Statt der leeren Standard-404 von Next.js: Wege zurück zur Website und in die App. */
export default async function NotFound() {
  const { t } = await getI18n();
  const actor = await getActor().catch(() => null);
  return (
    <main id="main" className="legal">
      <div className="legal-top">
        <Link href="/" className="wordmark">Transferborsa</Link>
      </div>
      <h1>{t("Seite nicht gefunden")}</h1>
      <p>{t("Diese Seite gibt es nicht oder nicht mehr. Vielleicht hat sich die Adresse geändert.")}</p>
      <div className="actions-row gap-top">
        {actor
          ? <Link href={actor.org?.role === "DRIVER" ? "/fahrer" : "/dashboard"} className="btn accent">{t("Zur Übersicht")}</Link>
          : <Link href="/" className="btn accent">{t("← Zur Startseite")}</Link>}
        <BackLink fallback="/">{t("← Zurück")}</BackLink>
      </div>
    </main>
  );
}
