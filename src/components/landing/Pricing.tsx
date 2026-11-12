import Link from "next/link";
import { cookies } from "next/headers";
import "@fontsource-variable/imbue";
import "@fontsource-variable/albert-sans";
import "./fragments.css";
import "./home.css";
import { Logo } from "../Logo";
import { LangSwitch } from "../LangSwitch";
import { SiteFooter } from "./SiteFooter";
import { TaxiSign } from "./TaxiSign";
import { ThemeToggle } from "./ThemeToggle";
import { PLANS } from "@/lib/plans";
import { themeFromCookie } from "@/lib/theme";
import { getI18n } from "@/server/i18n";

/** Öffentliche Preisseite im Look der Startseite: der Preis auf dem Taxischild, drei Tarife, Auftraggeber kostenlos. */
export async function Pricing() {
  const { t, f } = await getI18n();
  const theme = themeFromCookie((await cookies()).get("hp-theme")?.value);
  return (
    <div className="hp" data-theme={theme}>
      <header className="hp-head">
        <Link href="/" className="hp-logo" aria-label={t("Transferborsa, zur Startseite")}><Logo /></Link>
        <nav aria-label={t("Abschnitte")}>
          <LangSwitch path="/preise" className="hp-lang" />
          <ThemeToggle initial={theme} labels={{ auto: t("Darstellung: nach Gerät"), light: t("Darstellung: hell"), dark: t("Darstellung: dunkel") }} nextLabel={t("Klick wechselt zu")} />
          <Link href="/login" className="hp-btn hp-btn-head">{t("Anmelden")}</Link>
        </nav>
      </header>

      <main>
        <section className="hp-box hp-pr-head" aria-labelledby="hp-pr-title">
          <h1 id="hp-pr-title" className="hp-d">{t("Preise")}</h1>
          <p className="hp-lead">{t("Ein fester Monatspreis für Taxi- und Transferunternehmen. Für Reisebüros und Hotels ist Transferborsa kostenlos.")}</p>
        </section>

        <section className="hp-box" aria-labelledby="hp-pr-plans">
          <h2 id="hp-pr-plans">{t("Für Taxi- und Transferunternehmen")}</h2>
          <ul className="hp-plans">
            {PLANS.map((p) => (
              <li key={p.id} className="hp-plan">
                <span className="hp-plan-sign"><TaxiSign label={f.money(p.priceCents)} tone="free" size="s" /></span>
                <h3>{p.name}</h3>
                <p className="hp-plan-summary">{t(p.summary)} <span className="hp-plan-net">{t("netto pro Monat")}</span></p>
                <ul className="hp-plan-features">
                  {p.features.map((x) => <li key={x}>{t(x)}</li>)}
                </ul>
                <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn" aria-label={t("Mit Tarif {name} registrieren", { name: p.name })}>
                  {t("Registrieren")}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="hp-plan-notes">
            <li>{t("Alle Preise netto, zuzüglich Umsatzsteuer.")}</li>
            <li>{t("Abrechnung monatlich per Rechnung.")}</li>
            <li>{t("Wächst Ihre Flotte, wechseln Sie in den nächsten Tarif.")}</li>
          </ul>
        </section>

        <section className="hp-box hp-field hp-price" aria-labelledby="hp-pr-free">
          <h2 id="hp-pr-free">{t("Reisebüros und Hotels")}</h2>
          <div className="hp-price-grid">
            <p className="hp-price-sign"><span className="hp-sr">0 €</span><span aria-hidden="true"><TaxiSign label="0 €" tone="free" size="m" /></span></p>
            <div>
              <p>{t("Transfers anfragen, Angebote vergleichen und buchen ist für Auftraggeber kostenlos. Bezahlt wird nur die Fahrt selbst, direkt an das ausführende Unternehmen.")}</p>
              <div className="hp-act">
                <Link href="/register?type=TRAVEL_AGENCY" className="hp-btn">{t("Als Reisebüro registrieren")}</Link>
                <Link href="/login" className="hp-link">{t("Bereits registriert? Anmelden")}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter t={t} loggedIn={false} />
    </div>
  );
}
