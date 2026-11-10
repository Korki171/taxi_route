import Link from "next/link";
import "./footer.css";
import { NightRoad } from "./NightRoad";
import { Logo } from "../Logo";

type T = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Schluss der Startseite: Aufruf zur Anmeldung über Tiroler Bergen (Tag im hellen, Nacht im dunklen Modus; Straße, ein Taxi mit gelbem Schild),
 * darunter Logo und Links. Nur die Szene ist ein Client-Baustein (NightRoad), alles andere rendert der Server.
 */
export function SiteFooter({ t, loggedIn }: { t: T; loggedIn: boolean }) {
  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t("Produkt"),
      links: [
        { label: t("Ablauf"), href: "#ablauf" },
        { label: t("Partner"), href: "#partner" },
        { label: t("Preise"), href: "/preise" },
        { label: t("Fragen"), href: "#fragen" },
      ],
    },
    {
      title: t("Konto"),
      links: [
        ...(loggedIn ? [] : [{ label: t("Anmelden"), href: "/login" }]),
        { label: t("Unternehmen registrieren"), href: "/register?type=TRANSPORT_COMPANY" },
        { label: t("Reisebüro oder Hotel registrieren"), href: "/register?type=TRAVEL_AGENCY" },
      ],
    },
    {
      title: t("Rechtliches"),
      links: [
        { label: t("Impressum"), href: "/impressum" },
        { label: t("Datenschutz"), href: "/datenschutz" },
        { label: t("Nutzungsbedingungen"), href: "/nutzungsbedingungen" },
        { label: t("Kontakt"), href: "mailto:transferborsatirol@gmail.com?subject=Transferborsa" },
      ],
    },
  ];

  return (
    <footer className="mf" aria-labelledby="mf-title">
      <div className="mf-sky">
        <NightRoad />
        <div className="mf-call">
          <h2 id="mf-title" className="hp-d">{t("Steigen Sie ein.")}</h2>
          <p>{t("Die Anmeldung ist kostenlos. Sobald wir Ihr Unternehmen geprüft haben, können Sie Fahrten abgeben und übernehmen.")}</p>
          <div className="hp-act">
            <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn">{t("Unternehmen registrieren")}</Link>
            <Link href="/register?type=TRAVEL_AGENCY" className="hp-link">{t("Reisebüro oder Hotel registrieren")}</Link>
          </div>
        </div>
      </div>

      <div className="mf-ground">
        <div className="mf-brand">
          <Link href="/" className="mf-logo" aria-label="Transferborsa"><Logo /></Link>
          <p>{t("Die Börse für Taxi- und Transferunternehmen in Tirol.")}</p>
        </div>
        <nav className="mf-cols" aria-label={t("Weitere Seiten")}>
          {columns.map((col) => (
            <div key={col.title}>
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href}>{l.href.startsWith("/") ? <Link href={l.href}>{l.label}</Link> : <a href={l.href}>{l.label}</a>}</li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <p className="mf-end">© 2026 Transferborsa · Innsbruck</p>
      </div>
    </footer>
  );
}
