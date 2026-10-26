import Link from "next/link";
import { getI18n } from "@/server/i18n";
import { LangSwitch } from "./LangSwitch";

/** Rahmen für Impressum, Datenschutz und Nutzungsbedingungen. Der Text ist deutsch (maßgebliche Fassung). */
export async function LegalPage({ title, path, children }: { title: string; path: string; children: React.ReactNode }) {
  const { t, locale } = await getI18n();
  return (
    <main className="legal">
      <p className="right"><LangSwitch path={path} /></p>
      <p><Link href="/">TaxiRoute</Link></p>
      <h1>{t(title)}</h1>
      <p className="draft">
        {t("Entwurf: Dieser Text ist eine Vorlage und muss vor dem Livebetrieb rechtlich geprüft und mit den Angaben in eckigen Klammern ergänzt werden.")}
      </p>
      {locale === "en" && <p className="muted">{t("Dieser Text liegt derzeit nur auf Deutsch vor. Die deutsche Fassung ist maßgeblich.")}</p>}
      <div lang="de">{children}</div>
      <nav className="footer-links">
        <Link href="/impressum">{t("Impressum")}</Link>
        <Link href="/datenschutz">{t("Datenschutz")}</Link>
        <Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link>
      </nav>
    </main>
  );
}
