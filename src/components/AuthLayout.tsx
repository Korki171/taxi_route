import { cookies } from "next/headers";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getI18n } from "@/server/i18n";
import { LangSwitch } from "./LangSwitch";
import { TaxiSign } from "./landing/TaxiSign";
import { ThemeToggle } from "./landing/ThemeToggle";
import "./auth.css";

/**
 * Rahmen für Anmeldung, Registrierung, Passwort und Einladung im Look der Startseite:
 * links das gelbe Dachschild mit dem Satz, rechts das Formular auf Papier.
 * Hell ist Standard; der Umschalter oben teilt sich das Cookie hp-theme mit der Startseite.
 * Auf dem Handy steht das Schild oben, kurz.
 */
export async function AuthLayout({ path, wide, children }: { path: string; wide?: boolean; children: React.ReactNode }) {
  const { t } = await getI18n();
  const theme = (await cookies()).get("hp-theme")?.value === "dark" ? "dark" : "light";
  return (
    <div className="auth" data-theme={theme}>
      <aside className="auth-side">
        <Link href="/" className="wordmark" aria-label="Transferborsa"><Logo /></Link>
        <div className="auth-pitch">
          <span className="auth-sign" aria-hidden="true"><TaxiSign label={t("Frei")} tone="free" size="m" /></span>
          <p className="auth-claim">{t("Keine Fahrt bleibt liegen.")}</p>
          <p className="auth-lead">{t("Taxi- und Mietwagenunternehmen in Tirol geben Fahrten ab, die sie nicht schaffen. Das erste geprüfte Unternehmen mit freiem Wagen übernimmt zum Festpreis.")}</p>
        </div>
        <nav className="auth-foot" aria-label={t("Rechtliches")}>
          <Link href="/impressum">{t("Impressum")}</Link>
          <Link href="/datenschutz">{t("Datenschutz")}</Link>
          <Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link>
        </nav>
      </aside>
      <main id="main" className="auth-main">
        <div className="auth-top">
          <LangSwitch path={path} />
          <ThemeToggle initial={theme} labels={{ toDark: t("Dunkle Ansicht"), toLight: t("Helle Ansicht") }} />
        </div>
        <div className={wide ? "auth-body wide" : "auth-body"}>
          <p className="back"><Link href="/">{t("← Zur Startseite")}</Link></p>
          {children}
        </div>
      </main>
    </div>
  );
}
