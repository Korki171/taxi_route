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
import { Crossfade } from "./Crossfade";
import { SiteFooter } from "./SiteFooter";
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

/** Chat, wie er heute abläuft. */
function ChatScene({ t }: { t: T }) {
  const msgs: [string, string, string][] = [
    ["me", "Sa 11:00 Flughafen München → Kitzbühel, 6 Personen, 6 Koffer. Wer kann?", "09:12"],
    ["Hannes", "ich hätt nur einen Achter am Nachmittag", "09:14"],
    ["Selim", "Preis?", "09:14"],
    ["Marko", "bin ab 12 frei", "09:20"],
    ["me", "Muss 11:00 sein, Flieger landet 10:05", "09:21"],
    ["Selim", "wie viele Ski??", "09:35"],
    ["Hannes", "frag mal Lukas, der hat den Kleinbus", "09:41"],
  ];
  return (
    <figure className="hp-chat" data-ui aria-label={t("Beispiel: Fahrt in der Gruppe suchen")}>
      <figcaption>
        <b>{t("Fahrer Innsbruck")}</b>
        <span>{t("Gruppenchat · 14 Mitglieder")}</span>
      </figcaption>
      <ol>
        {msgs.map(([who, text, time], i) => (
          <li key={i} className={who === "me" ? "me" : undefined}>
            {who !== "me" && <b>{who}</b>}
            <p>{t(text)}</p>
            <time>{time}</time>
          </li>
        ))}
      </ol>
    </figure>
  );
}

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
      <p className="hp-paper-head"><b>{t("Buchungsbestätigung")}</b><span>TB-2411-0187</span></p>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}><dt>{t(k)}</dt><dd>{t(v)}</dd></div>
        ))}
      </dl>
    </div>
  );
}

function Photo({ src, alt = "", w, h, eager, className }: { src: string; alt?: string; w: number; h: number; eager?: boolean; className?: string }) {
  return <img className={className} src={src} width={w} height={h} alt={alt} loading={eager ? undefined : "lazy"} decoding="async" />;
}

export async function Landing({ appHref }: { appHref?: string } = {}) {
  const { t, locale } = await getI18n();
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
  const steps: [string, string, string, string][] = [
    ["Frei", "Abgeben", "Sie stellen die Fahrt einmal ein, mit Zeit, Gepäck und Festpreis. Alle geprüften Kollegen sehen sie.", "Taxi Hofer · 310 € Festpreis"],
    ["Besetzt", "Übernehmen", "Der erste Kollege mit freiem Wagen übernimmt. Für alle anderen ist die Fahrt weg.", "Alpen Taxi Innsbruck"],
    ["Bestätigt", "Bestätigen", "Preis, Flug, Gepäck und Stornobedingungen stehen in einer Bestätigung als PDF.", "TB-2411-0187"],
    ["Erledigt", "Fahren", "Die Fahrt ist gefahren. Beide Seiten sehen denselben Stand.", "beide Seiten"],
  ];
  const counts: [string, string][] = [
    ["Festpreis oder Angebot", "Das erste geprüfte Unternehmen übernimmt direkt und verbindlich, oder Unternehmen geben Angebote ab."],
    ["Nur geprüfte Unternehmen.", "Konzession, Versicherung und Firmendaten sind vorab geprüft."],
    ["Fahrgastdaten bleiben privat", "Namen und Nummern sieht nur, wer die Fahrt übernimmt."],
    ["Bestätigung als PDF", "Preis, Gepäck und Stornobedingungen stehen mit jeder Buchung schwarz auf weiß da."],
  ];
  return (
    <div className="hp">
      <header className="hp-head">
        <Link href="/" className="hp-logo" aria-label="Transferborsa"><Logo mono /></Link>
        <nav aria-label={t("Abschnitte")}>
          <a href="#ablauf">{t("Ablauf")}</a>
          <a href="#partner">{t("Partner")}</a>
          <Link href="/preise">{t("Preise")}</Link>
          <a href="#fragen">{t("Fragen")}</a>
          <LangSwitch path="/" className="hp-lang" />
          {!appHref && <Link href="/login">{t("Anmelden")}</Link>}
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

        {/* Ablauf: dieselbe Fahrt in vier Zeilen, daneben das, was heute passiert, und das, was danach dasteht */}
        <section id="ablauf" className="hp-box" aria-labelledby="hp-ablauf">
          <h2 id="hp-ablauf">{t("So läuft eine Fahrt.")}</h2>
          <ol className="hp-steps">
            {steps.map(([sign, s, what, who], i) => (
              <li key={s}>
                <TaxiSign label={t(sign)} tone={i === 0 ? "free" : i === 1 ? "busy" : "off"} size="s" />
                <h3>{i + 1} {t(s)}</h3>
                <p>{t(what)}</p>
                <p className="hp-steps-who">{t(who)}</p>
              </li>
            ))}
          </ol>
          <div className="hp-pair">
            <div>
              <h3>{t("Bisher läuft es so.")}</h3>
              <p>{t("Die Fahrt geht in die Gruppe, drei Kollegen antworten halb, Preis und Gepäck bleiben mündlich.")}</p>
              <ChatScene t={t} />
            </div>
            <div>
              <h3>{t("Danach steht alles schriftlich da.")}</h3>
              <p>{t("Preis, Flug, Gepäck und Stornobedingungen in einer Bestätigung als PDF.")}</p>
              <Confirmation t={t} />
            </div>
          </div>
        </section>

        <section className="hp-box" aria-labelledby="hp-zaehlt">
          <h2 id="hp-zaehlt">{t("Was bei einer Weitergabe zählt.")}</h2>
          <table className="hp-facts">
            <tbody>
              {counts.map(([k, v]) => (
                <tr key={k}><th scope="row">{t(k)}</th><td>{t(v)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Partner: wer die Fahrt zuerst sieht, als Treppe in drei Stufen; daneben ein Foto im Rahmen */}
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
          <figure className="hp-pic">
            <Crossfade
              w={1100} h={1400}
              images={[
                { src: "/landing/tirol/arlberg-gipfel.jpg", alt: t("Verschneiter Gipfel am Arlberg") },
                { src: "/landing/tirol/mayrhofen-abend.jpg", alt: t("Abendlicht über dem Zillertal bei Mayrhofen") },
                { src: "/landing/tirol/innsbruck-hofgasse.jpg", alt: t("Die Hofgasse in der Innsbrucker Altstadt") },
              ]}
            />
            <figcaption>{t("Fotos: Erich Fend, Linas Bam, Leonhard Lenz (Unsplash, alle CC0)")}</figcaption>
          </figure>
        </section>

        {/* Preis: die Zahl als Tafelziffern */}
        <section className="hp-box hp-price" aria-labelledby="hp-preis">
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

        <section id="fragen" className="hp-box" aria-labelledby="hp-fragen">
          <h2 id="hp-fragen">{t("Häufige Fragen")}</h2>
          <table className="hp-facts hp-faq">
            <tbody>
              {FAQ.map(([q, a]) => (
                <tr key={q}><th scope="row">{t(q)}</th><td>{t(a)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      <SiteFooter t={t} loggedIn={!!appHref} />
    </div>
  );
}
