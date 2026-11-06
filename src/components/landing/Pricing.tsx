import Link from "next/link";
import "@fontsource-variable/imbue";
import "@fontsource-variable/albert-sans";
import "./landing.css";
import { Logo } from "../Logo";
import { LangSwitch } from "../LangSwitch";
import { PLANS } from "@/lib/plans";
import { getI18n } from "@/server/i18n";

/** Öffentliche Preisseite im Stil der Landing Page: drei Tarife für Taxiunternehmen, Auftraggeber kostenlos. */
export async function Pricing() {
  const { t, f } = await getI18n();
  return (
    <div className="lp">
      <main>
        <section className="lp-pr-hero" aria-labelledby="lp-pr-title">
          <div className="lp-top">
            <LangSwitch path="/preise" className="lp-toplink" />
            <Link href="/" className="lp-wordmark" aria-label={t("Transferborsa, zur Startseite")}><Logo /></Link>
            <Link href="/login" className="lp-toplink lp-toplink-end">{t("Anmelden")}</Link>
          </div>
          <h1 id="lp-pr-title" className="lp-pr-title">{t("Preise")}</h1>
          <p className="lp-pr-lead">
            {t("Ein fester Monatspreis für Taxi- und Transferunternehmen, ohne Provision pro Fahrt. Für Reisebüros und Hotels ist Transferborsa kostenlos.")}
          </p>
        </section>

        <section className="lp-pr-plans" aria-label={t("Tarife für Taxiunternehmen")}>
          <h2 className="lp-pr-h">{t("Für Taxi- und Transferunternehmen")}</h2>
          <ul className="lp-pr-grid">
            {PLANS.map((p, i) => (
              <li key={p.id} className="lp-pr-card" data-tone={i === 2 ? "ink" : "paper"}>
                <h3 className="lp-pr-name">{p.name}</h3>
                <p className="lp-pr-summary">{t(p.summary)}</p>
                <p className="lp-pr-price">
                  <strong>{f.money(p.priceCents)}</strong>
                  <span>{t("netto pro Monat")}</span>
                </p>
                <ul className="lp-pr-features">
                  {p.features.map((x) => <li key={x}>{t(x)}</li>)}
                </ul>
                <Link
                  href="/register?type=TRANSPORT_COMPANY"
                  className={`lp-btn ${i === 2 ? "lp-btn-accent" : "lp-btn-ink"}`}
                  aria-label={t("Mit Tarif {name} registrieren", { name: p.name })}
                >
                  {t("Registrieren")}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="lp-pr-notes">
            <li>{t("Alle Preise netto, zuzüglich Umsatzsteuer.")}</li>
            <li>{t("Keine Provision und keine Gebühr pro Fahrt.")}</li>
            <li>{t("Abrechnung monatlich per Rechnung.")}</li>
            <li>{t("Wächst Ihre Flotte, wechseln Sie in den nächsten Tarif.")}</li>
          </ul>
        </section>

        <section className="lp-chapter lp-preis" aria-labelledby="lp-pr-free">
          <div className="lp-ticket">
            <div className="lp-ticket-main">
              <h2 id="lp-pr-free" className="lp-ticket-price">
                <span>{t("Reisebüros und Hotels")}</span> <strong>0 €</strong>
              </h2>
              <p>
                {t("Transfers anfragen, Angebote vergleichen und buchen ist für Auftraggeber kostenlos. Bezahlt wird nur die Fahrt selbst, direkt an das ausführende Unternehmen.")}
              </p>
            </div>
            <div className="lp-ticket-stub">
              <Link href="/register?type=TRAVEL_AGENCY" className="lp-btn lp-btn-ink">{t("Als Reisebüro registrieren")}</Link>
              <Link href="/login" className="lp-textlink">{t("Bereits registriert? Anmelden")}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer lp-pr-footer">
        <div className="lp-footer-grid">
          <p className="lp-footer-about">
            <strong>Transferborsa</strong>, {t("die Börse für Taxi- und Transferunternehmen in Tirol und Bayern.")}
          </p>
          <ul className="lp-footer-links">
            <li><Link href="/">{t("Startseite")}</Link></li>
            <li><Link href="/register">{t("Registrieren")}</Link></li>
            <li><Link href="/impressum">{t("Impressum")}</Link></li>
            <li><Link href="/datenschutz">{t("Datenschutz")}</Link></li>
            <li><Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
