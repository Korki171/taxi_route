import { Logo } from "../Logo";
import Link from "next/link";
import type { CSSProperties } from "react";
import "@fontsource-variable/albert-sans";
import "@fontsource-variable/imbue";
import "./fragments.css";
import "./home.css";
import { LangSwitch } from "../LangSwitch";
import { HeroClaim } from "./HeroClaim";
import { TaxiSign } from "./TaxiSign";
import { PartnerRelay } from "./PartnerRelay";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";
import { cookies } from "next/headers";
import { getI18n } from "@/server/i18n";
import { PLANS } from "@/lib/plans";

// Startseite „Das Taxischild“ (2026-11-10). Gewählt aus vier Hero-Varianten (Taxischild, Fahrtenbuch, Funk, Fallblatt-Tafel).
// Idee: Keine Fahrt bleibt liegen. Das gelbe Dachschild leuchtet FREI, solange eine Fahrt offen ist, und geht auf BESETZT, sobald jemand übernimmt.
// Farbwelt „Ruß bei Nacht“ (home.css). Doppelrahmen und echte Tabellen; am Ende der Nacht-Footer (SiteFooter).
// Alle Namen und Fahrten in den Beispielen sind erfunden.

/** Wer eine Fahrt zuerst sieht (Audience OWN → PARTNERS → MARKET in src/server/services/partners.ts). */
const AUDIENCE: [string, string][] = [
  ["Eigene Fahrer", "Passt es in Ihren eigenen Plan, fahren Sie selbst. Niemand sonst sieht die Fahrt."],
  ["Ihre Partner", "Dann sehen sie die Unternehmen auf Ihrer Partnerliste. Bis zu 100 Kollegen, die Sie selbst auswählen."],
  ["Alle Geprüften", "Übernimmt kein Partner, geht die Fahrt an alle geprüften Unternehmen der Börse. Auf Wunsch sofort."],
];

const FAQ: [string, string][] = [
  [
    "Wer prüft die Unternehmen?",
    "Wir prüfen Konzession, Versicherung und Firmendaten, bevor ein Unternehmen Aufträge übernehmen oder Fahrzeuge anbieten darf. Geprüft wird je Geschäftsfunktion. Grenzüberschreitende Strecken werden gesondert betrachtet.",
  ],
  [
    "Wer sieht die Daten meiner Fahrgäste?",
    "Nur der Auftraggeber und das Unternehmen, das die bestätigte Fahrt durchführt. Andere Teilnehmer der Börse sehen Strecke, Zeit, Personenzahl und Gepäck, aber keine Namen oder Telefonnummern.",
  ],
  [
    "Wie wird bezahlt?",
    "Fahrpreise rechnen die beteiligten Unternehmen direkt miteinander ab; vereinbarter Preis und Rechnungsreferenz werden mit der Buchung gespeichert. Taxiunternehmen zahlen für Transferborsa einen festen Monatspreis per Rechnung. Für Reisebüros und Hotels ist die Nutzung kostenlos.",
  ],
  [
    "Was gilt bei Storno oder Verspätung?",
    "Die vereinbarten Stornobedingungen werden mit jeder Buchung festgehalten. Änderungen, Verspätungen und Rückfragen laufen über den Auftrag selbst, damit beide Seiten denselben Stand sehen.",
  ],
];

type T = (key: string, vars?: Record<string, string | number>) => string;

/* ---------- Oberflächen als HTML, nicht als Bild: bleiben scharf und übersetzbar (data-ui) ---------- */

function Confirmation({ t }: { t: T }) {
  const rows: [string, string][] = [
    ["Strecke", "Flughafen München → Kitzbühel"],
    ["Abholung", "Sa 15.11., 11:00 Uhr"],
    ["Flug", "OS 112, Landung 10:05"],
    ["Fahrgäste", "6 Personen"],
    ["Gepäck", "6 Koffer, 4 Paar Ski"],
    ["Fahrzeug", "Kleinbus"],
    ["Preis", "310 € Festpreis"],
    ["Storno", "bis 24 h vorher kostenlos"],
  ];
  return (
    <div className="hp-paper" data-ui aria-label={t("Beispiel: Bestätigung als PDF")}>
      <Logo className="hp-paper-logo" aria-hidden="true" />
      <p className="hp-paper-head"><b>{t("Buchungsbestätigung")}</b><span>TB-2411-0187</span></p>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}><dt>{t(k)}</dt><dd>{t(v)}</dd></div>
        ))}
      </dl>
    </div>
  );
}

/** Gefundene Bilder aus der Welt der Taxler (Wikimedia Commons, Nachweis im Footer). */
function Photo({ src, alt, w, h }: { src: string; alt: string; w: number; h: number }) {
  return <img src={src} width={w} height={h} alt={alt} loading="lazy" decoding="async" />;
}

export async function Landing({ appHref }: { appHref?: string } = {}) {
  const { t, locale } = await getI18n();
  // Hell ist Standard; „Ruß bei Nacht“ nur, wenn der Besucher es oben umgeschaltet hat.
  const theme = (await cookies()).get("hp-theme")?.value === "dark" ? "dark" : "light";
  const plan = PLANS[0];
  const figure = (plan.priceCents / 100).toLocaleString(locale === "en" ? "en-GB" : "de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rt = (s: string) => s.split(" → ").map((x) => t(x)).join(" → ");
  const registerHref = appHref ?? "/register?type=TRANSPORT_COMPANY";
  const claim = {
    free: t("Frei"), busy: t("Besetzt"), open: t("Offen"), taken: t("Vergeben"),
    route: rt("Flughafen München → Kitzbühel"), when: `${t("Sa 15.11.")} · ${t("11:00 Uhr")} · ${t("Flug OS 112")}`,
    load: t("6 Personen · 6 Koffer · 4 Paar Ski · Kleinbus"), price: "310 €", fixed: t("Festpreis"),
    claim: t("Zum Festpreis übernehmen"), by: t("Übernommen von {name}.", { name: "Alpen Taxi Innsbruck" }),
    gone: t("Für alle anderen ist die Fahrt weg."), reset: t("Zurücksetzen"), hint: t("Probieren Sie es aus: Die Fahrt übernehmen."),
  };
  const relay = {
    stages: AUDIENCE.map(([who]) => t(who)) as [string, string, string],
    route: claim.route, when: `${t("Sa 15.11.")} · ${t("11:00 Uhr")}`, price: "310 €",
    open: t("Offen"), taken: t("Vergeben"), free: t("Frei"), busy: t("Besetzt"),
    summary: t("Beispiel: Die Fahrt geht zuerst an die eigenen Fahrer, dann an drei Partner, dann an alle geprüften Unternehmen. Eines übernimmt."),
  };
  const steps: [string, string, string, string][] = [
    ["Frei", "Abgeben", "Sie stellen die Fahrt einmal ein, mit Zeit, Gepäck und Festpreis. Alle geprüften Kollegen sehen sie.", "Taxi Hofer · 310 € Festpreis"],
    ["Besetzt", "Übernehmen", "Der erste Kollege mit freiem Wagen übernimmt. Für alle anderen ist die Fahrt weg.", "Alpen Taxi Innsbruck"],
    ["Bestätigt", "Bestätigen", "Preis, Flug, Gepäck und Stornobedingungen stehen in einer Bestätigung als PDF.", "TB-2411-0187"],
    ["Erledigt", "Fahren", "Die Fahrt ist gefahren. Beide Seiten sehen denselben Stand.", "beide Seiten"],
  ];
  return (
    <div className="hp" data-theme={theme}>
      <header className="hp-head">
        <Link href="/" className="hp-logo" aria-label="Transferborsa"><Logo /></Link>
        <nav aria-label={t("Abschnitte")}>
          <a href="#ablauf" className="hp-nav-sec">{t("Ablauf")}</a>
          <a href="#partner" className="hp-nav-sec">{t("Partner")}</a>
          <Link href="/preise" className="hp-nav-sec">{t("Preise")}</Link>
          <a href="#fragen" className="hp-nav-sec">{t("Fragen")}</a>
          <LangSwitch path="/" className="hp-lang" />
          <ThemeToggle initial={theme} labels={{ toDark: t("Dunkle Ansicht"), toLight: t("Helle Ansicht") }} />
          {/* Immer sichtbar, auch am Handy: angemeldet direkt in die App, sonst zur Anmeldung */}
          <Link href={appHref ?? "/login"} className="hp-btn hp-btn-head">{t("Zur App")}</Link>
        </nav>
      </header>

      <main>
        {/* Erste Seite: der Satz, daneben das Schild über einer echten Fahrt. Übernehmen schaltet das Schild auf BESETZT. */}
        <section className="hp-box hp-hero" aria-labelledby="hp-title">
          <div className="hp-hero-copy">
            <h1 id="hp-title" className="hp-d">{t("Keine Fahrt bleibt liegen.")}</h1>
            <p className="hp-lead">{t("Taxi- und Mietwagenunternehmen in Tirol geben Fahrten ab, die sie nicht schaffen. Das erste geprüfte Unternehmen mit freiem Wagen übernimmt zum Festpreis.")}</p>
            <div className="hp-act">
              <Link href={registerHref} className="hp-btn">{appHref ? t("Zur App") : t("Unternehmen registrieren")}</Link>
              <a href="#ablauf" className="hp-link">{t("So läuft eine Fahrt")}</a>
            </div>
          </div>
          <HeroClaim L={claim} />
        </section>

        {/* Ablauf: dieselbe Fahrt in vier Schildern, darunter die Bestätigung, die danach dasteht */}
        <section id="ablauf" className="hp-box" aria-labelledby="hp-ablauf">
          <h2 id="hp-ablauf">{t("So läuft eine Fahrt.")}</h2>
          <ol className="hp-steps">
            {steps.map(([sign, s, what, who], i) => (
              <li key={s}>
                <TaxiSign label={t(sign)} tone={i === 0 ? "free" : i === 1 ? "busy" : "off"} size="s" />
                <h3><span className="hp-steps-n">{i + 1}</span> {t(s)}</h3>
                <p>{t(what)}</p>
                <p className="hp-steps-who">{t(who)}</p>
              </li>
            ))}
          </ol>
          <div className="hp-proof">
            <div>
              <h3>{t("Danach steht alles schriftlich da.")}</h3>
              <p>{t("Bisher geht die Fahrt in die Gruppe, drei Kollegen antworten halb, Preis und Gepäck bleiben mündlich. Hier haben beide Seiten dasselbe Dokument, auch bei Storno.")}</p>
              <div className="hp-act">
                <Link href={registerHref} className="hp-btn">{appHref ? t("Zur App") : t("Unternehmen registrieren")}</Link>
              </div>
            </div>
            <Confirmation t={t} />
          </div>
        </section>

        {/* Partner: wer die Fahrt zuerst sieht, als Treppe in drei Stufen; daneben dieselbe Fahrt als Staffel (PartnerRelay) */}
        <section id="partner" className="hp-box hp-routes-box" aria-labelledby="hp-partner">
          <div>
            <h2 id="hp-partner">{t("Erst Ihre Partner, dann alle.")}</h2>
            <ol className="hp-stairs">
              {AUDIENCE.map(([who, what], i) => (
                <li key={who} style={{ "--i": i } as CSSProperties}>
                  <h3><span>{i + 1}</span> {t(who)}</h3>
                  <p>{t(what)}</p>
                </li>
              ))}
            </ol>
            <p className="hp-stairs-note">{t("Wen Sie sperren, der sieht Ihre Fahrten nicht mehr. Und vor der Übernahme sieht niemand Namen, Adressen oder Telefonnummern Ihrer Fahrgäste.")}</p>
          </div>
          <PartnerRelay L={relay} />
        </section>

        {/* Preis: die Zahl als Tafelziffern, auf grauer Fläche */}
        <section className="hp-box hp-field hp-price" aria-labelledby="hp-preis">
          <h2 id="hp-preis">{t("Ein Preis für alle Fahrten.")}</h2>
          <div className="hp-price-grid">
            <p className="hp-price-sign"><span className="hp-sr">{t("Ab")} {figure} € {t("im Monat.")}</span><span aria-hidden="true"><TaxiSign label={`${figure} €`} tone="free" size="m" /></span></p>
            <div>
              <p><b>{t("Ab")} {figure} € {t("im Monat.")}</b> {t("Fester Monatspreis per Rechnung für Taxi- und Transferunternehmen. Für Reisebüros und Hotels ist die Nutzung kostenlos.")}</p>
              <ul>{plan.features.slice(0, 4).map((f) => <li key={f}>{t(f)}</li>)}</ul>
              <div className="hp-act">
                <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn">{t("Unternehmen registrieren")}</Link>
                <Link href="/preise" className="hp-link">{t("Preise")}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Fragen: auf derselben grauen Fläche wie der Preis; echte Tabelle, daneben Schneetreiben, wenn Storno und Verspätung zur Frage werden */}
        <section id="fragen" className="hp-box hp-field hp-faq-box" aria-labelledby="hp-fragen">
          <div>
            <h2 id="hp-fragen">{t("Häufige Fragen")}</h2>
            <table className="hp-facts hp-faq">
              <tbody>
                {FAQ.map(([q, a]) => (
                  <tr key={q}><th scope="row">{t(q)}</th><td>{t(a)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <figure className="hp-photo">
            <Photo src="/landing/welt/mathon-ischgl-winter.jpg" alt={t("Verschneite Straße im Schneetreiben in Mathon bei Ischgl, mit Bushaltestelle")} w={1920} h={1080} />
            <figcaption>{t("Mathon bei Ischgl im Schneetreiben. An solchen Tagen zählen klare Regeln für Storno und Verspätung.")}</figcaption>
          </figure>
        </section>
      </main>

      <SiteFooter t={t} loggedIn={!!appHref} />
    </div>
  );
}
