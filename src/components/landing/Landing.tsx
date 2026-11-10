import { Logo } from "../Logo";
import Link from "next/link";
import "@fontsource-variable/albert-sans";
import "@fontsource-variable/imbue";
import "./fragments.css";
import "./home.css";
import { LangSwitch } from "../LangSwitch";
import { Board } from "./Board";
import { Crossfade } from "./Crossfade";
import { getI18n } from "@/server/i18n";
import { PLANS } from "@/lib/plans";

// Startseite „Die Tafel“ (2026-11-10). Richtung gewählt aus zwölf Entwürfen nach Awwwards-Gewinnern: Le Petit Bleu (eine Tinte, Doppelrahmen).
// Idee: Die Börse ist eine Abflugtafel der Fahrten. Jede Fahrt ist eine Zeile, jeder Zustand ein Wort. Tabellen sind echte Tabellen.
// Alle Namen und Fahrten in den Beispielen sind erfunden.

/** Strecken mit ungefährer Fahrzeit ab Flughafen München (Werte wie in der App). */
const ROUTES: [string, string][] = [
  ["Flughafen München → Innsbruck", "ca. 1 h 50 min"],
  ["Flughafen München → Kitzbühel", "ca. 1 h 40 min"],
  ["Flughafen München → Mayrhofen", "ca. 2 h"],
  ["Flughafen München → Sölden", "ca. 2 h 30 min"],
  ["Innsbruck → Seefeld, Hall, Kufstein, St. Anton", "regional"],
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
    "Fahrpreise rechnen die beteiligten Unternehmen direkt miteinander ab; vereinbarter Preis und Rechnungsreferenz werden mit der Buchung gespeichert. Taxiunternehmen zahlen für Transferborsa einen festen Monatspreis per Rechnung, ohne Provision pro Fahrt. Für Reisebüros und Hotels ist die Nutzung kostenlos.",
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
  const rows = [
    { time: "11:00", route: rt("Flughafen München → Kitzbühel"), persons: "6", price: "310 €", status: t("Offen"), tone: "open" as const },
    { time: "12:15", route: rt("Flughafen München → Mayrhofen"), persons: "3", price: t("offen"), status: t("3 Angebote"), tone: "open" as const },
    { time: "14:30", route: rt("Innsbruck → St. Anton"), persons: "4", price: "180 €", status: t("Vergeben"), tone: "taken" as const },
    { time: "16:00", route: rt("Flughafen München → Sölden"), persons: "7", price: "420 €", status: t("Erledigt"), tone: "ok" as const },
  ];
  const board = {
    caption: t("Fahrten heute in der Börse"),
    head: [t("Zeit"), t("Strecke"), t("Personen"), t("Preis"), t("Stand")],
    claim: t("Zum Festpreis übernehmen"), reset: t("Zurücksetzen"), taken: t("Vergeben"),
    by: t("Übernommen von {name}", { name: "Alpen Taxi Innsbruck" }),
    hint: t("Probieren Sie es aus: Die Fahrt übernehmen."),
  };
  const steps: [string, string, string, string][] = [
    ["Abgeben", "Erst wird sie eingestellt.", "Offen", "310 € Festpreis"],
    ["Übernehmen", "Dann übernimmt jemand.", "Vergeben", "Alpen Taxi Innsbruck"],
    ["Bestätigen", "Dann steht alles schriftlich da.", "PDF", "TB-2411-0187"],
    ["Erledigt", "Dann ist die Fahrt erledigt.", "Erledigt", "beide Seiten"],
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
          <a href="#strecken">{t("Strecken")}</a>
          <Link href="/preise">{t("Preise")}</Link>
          <a href="#fragen">{t("Fragen")}</a>
          <LangSwitch path="/" className="hp-lang" />
          {!appHref && <Link href="/login">{t("Anmelden")}</Link>}
        </nav>
      </header>

      <main>
        {/* Erste Seite: der Satz und die Tafel von heute, die erste Zeile lässt sich übernehmen */}
        <section className="hp-box hp-hero" aria-labelledby="hp-title">
          <h1 id="hp-title" className="hp-d"><span>{t("Abgeben.")}</span> <span>{t("Übernehmen.")}</span></h1>
          <p className="hp-lead">{t("Geprüfte Unternehmen in Tirol übernehmen die Fahrten, die Sie nicht schaffen.")} {t("Das Transfernetzwerk für Taxi- und Mietwagenunternehmen.")}</p>
          <Board rows={rows} L={board} />
          <div className="hp-act">
            <Link href={registerHref} className="hp-btn">{appHref ? t("Zur App") : t("Unternehmen registrieren")}</Link>
          </div>
        </section>

        {/* Ablauf: dieselbe Fahrt in vier Zeilen, daneben das, was heute passiert, und das, was danach dasteht */}
        <section id="ablauf" className="hp-box" aria-labelledby="hp-ablauf">
          <h2 id="hp-ablauf">{t("So läuft eine Fahrt.")}</h2>
          <table className="hp-flow">
            <thead><tr><th scope="col">{t("Schritt")}</th><th scope="col">{t("Was passiert")}</th><th scope="col">{t("Stand")}</th><th scope="col">{t("Wer")}</th></tr></thead>
            <tbody>
              {steps.map(([s, what, state, who], i) => (
                <tr key={s}>
                  <td data-label={t("Schritt")}><b>{i + 1} {t(s)}</b></td>
                  <td data-label={t("Was passiert")}>{t(what)}</td>
                  <td data-label={t("Stand")}>{t(state)}</td>
                  <td data-label={t("Wer")}>{t(who)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

        {/* Strecken: echte Tabelle, daneben ein Foto im Rahmen */}
        <section id="strecken" className="hp-box hp-routes-box" aria-labelledby="hp-strecken">
          <div>
            <h2 id="hp-strecken">{t("Die Strecken, auf denen wir anfangen")}</h2>
            <table className="hp-routes">
              <tbody>
                {ROUTES.map(([route, time]) => (
                  <tr key={route}><td>{rt(route)}</td><td>{t(time)}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="hp-small">{t("Salzburg, Zürich und Südtirol folgen, sobald dort regelmäßig Fahrten vermittelt werden.")}</p>
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
            <p className="hp-d hp-fig" aria-label={`${t("Ab")} ${figure} € ${t("im Monat.")}`}><span aria-hidden="true">{figure} €</span></p>
            <div>
              <p><b>{t("Ab")} {t("im Monat.")}</b> {t("Ohne Provision.")} {t("Fester Monatspreis per Rechnung für Taxi- und Transferunternehmen. Für Reisebüros und Hotels ist die Nutzung kostenlos.")}</p>
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

        <section className="hp-box hp-ask" aria-labelledby="hp-wer">
          <h2 id="hp-wer" className="hp-d"><span>{t("Taxi oder")}</span> <span>{t("Reisebüro?")}</span></h2>
          <div className="hp-act">
            <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn">{t("Unternehmen registrieren")}</Link>
            <span>{t("oder")}</span>
            <Link href="/register?type=TRAVEL_AGENCY" className="hp-btn hp-btn-ghost">{t("Reisebüro oder Hotel registrieren")}</Link>
          </div>
          <p className="hp-small">{t("Wir sind im Pilotbetrieb rund um Innsbruck und melden uns persönlich.")}</p>
        </section>
      </main>

      <footer className="hp-foot">
        <p>{t("Die Börse für Taxi- und Transferunternehmen in Tirol.")}</p>
        <nav aria-label={t("Rechtliches")}>
          <Link href="/preise">{t("Preise")}</Link>
          <Link href="/impressum">{t("Impressum")}</Link>
          <Link href="/datenschutz">{t("Datenschutz")}</Link>
          <Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link>
          <a href="mailto:transferborsatirol@gmail.com?subject=Transferborsa">{t("Kontakt")}</a>
        </nav>
        <p className="hp-foot-end">Innsbruck · 2026</p>
      </footer>
    </div>
  );
}
