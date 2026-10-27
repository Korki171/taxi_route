import Link from "next/link";
import { getI18n } from "@/server/i18n";
import { LangSwitch } from "./LangSwitch";

/**
 * Rahmen für Anmeldung, Registrierung, Passwort und Einladung: links das Navy-Feld mit dem Satz der
 * Landing Page, rechts das Formular auf Papier. Auf dem Handy steht das Feld oben, kurz.
 */
export async function AuthLayout({ path, wide, children }: { path: string; wide?: boolean; children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <div className="auth">
      <aside className="auth-side">
        <Link href="/" className="wordmark">TaxiRoute</Link>
        <div>
          <p className="auth-claim" aria-hidden><span>{t("Hin voll.")}</span><span>{t("Retour voll.")}</span></p>
          <p className="auth-lead">{t("Die Auftragsbörse für Taxiunternehmen und Reisebüros in Tirol.")}</p>
        </div>
        <nav className="auth-foot" aria-label={t("Rechtliches")}>
          <Link href="/impressum">{t("Impressum")}</Link>
          <Link href="/datenschutz">{t("Datenschutz")}</Link>
          <Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link>
        </nav>
      </aside>
      <main id="main" className="auth-main">
        <div className="auth-top"><LangSwitch path={path} /></div>
        <div className={wide ? "auth-body wide" : "auth-body"}>{children}</div>
      </main>
    </div>
  );
}
