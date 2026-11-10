import { Logo } from "../Logo";
import Link from "next/link";
import "@fontsource-variable/albert-sans";
import "@fontsource-variable/imbue";
import "./home.css";
import { LangSwitch } from "../LangSwitch";
import { ClaimOrder } from "./ClaimOrder";
import { getI18n } from "@/server/i18n";
import { formatCents } from "@/lib/money";
import { PLANS } from "@/lib/plans";

// Startseite „Der Transferschein“ (Redesign 2026-11-09). Richtung „The printed annual“ aus taste-skill, Typografie und
// Raster nach impeccable, Bewegung nach emil-design-eng. Inhalt und Aufbau nach caporide.com und timocom.de.
// Idee: Der Transferschein (die Bestätigung mit ihren beschrifteten Feldern) ist das Ordnungsprinzip: eine feste Achse,
// links das, was gemeint ist, rechts die Antwort. Echte Fotos aus Tirol tragen die Farbe, die Oberfläche der App die Beweise.
// Alle Namen und Fahrten in den Beispielen sind erfunden.

/** Strecken mit ungefährer Fahrzeit ab Flughafen München (Werte wie in der App). */
const ROUTES: [string, string][] = [
  ["Flughafen München → Innsbruck", "ca. 1 h 50 min"],
  ["Flughafen München → Kitzbühel", "ca. 1 h 40 min"],
  ["Flughafen München → Mayrhofen", "ca. 2 h"],
  ["Flughafen München → Sölden", "ca. 2 h 30 min"],
  ["Innsbruck → Seefeld, Hall, Kufstein, St. Anton", "regional"],
];

/** Vorher und nachher, Zeile für Zeile: links das Bisherige, rechts das, was Transferborsa daraus macht. */
const SHIFT: [string, string][] = [
  ["Fahrt in drei Gruppen posten, dann telefonieren", "Einmal einstellen, alle geprüften Kollegen sehen es"],
  ["Wer hat zugesagt? Steht irgendwo im Chat", "Einer übernimmt, die anderen sehen: weg"],
  ["Preis und Gepäck mündlich, nichts schriftlich", "Preis, Flug und Gepäck stehen in der Bestätigung (PDF)"],
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

/** Eine Karte der Börse in einem Zwischenstand; die Abläufe zeigen dieselbe Karte Schritt für Schritt. */
type CardSpec = {
  chip: string[];
  when: string;
  route: string;
  load: string;
  price: string[];
  lines?: string[];
  offers?: string[][];
  doc?: boolean;
};

const RUN = "Flughafen München → Kitzbühel";
const LOAD = "6 Personen · 6 Koffer · 4 Paar Ski · Kleinbus";
const OPEN = "hp-chip-open", TAKEN = "hp-chip-taken", OK = "hp-chip-ok";

type Flow = { id: string; title: string; steps: [string, CardSpec][] };

const FLOWS: Flow[] = [
  {
    id: "fahrt",
    title: "So läuft eine Fahrt.",
    steps: [
      ["Erst wird sie eingestellt.", { chip: [OPEN, "Offen"], when: "Sa 15.11. · 11:00 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"] }],
      ["Dann übernimmt jemand.", { chip: [TAKEN, "Vergeben"], when: "Sa 15.11. · 11:00 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Übernommen von Alpen Taxi Innsbruck"] }],
      ["Dann steht alles schriftlich da.", { chip: [TAKEN, "Vergeben"], when: "Sa 15.11. · 11:00 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Übernommen von Alpen Taxi Innsbruck"], doc: true }],
      ["Dann ist die Fahrt erledigt.", { chip: [OK, "Erledigt"], when: "Sa 15.11. · 11:00 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Übernommen von Alpen Taxi Innsbruck"], doc: true }],
    ],
  },
  {
    id: "angebote",
    title: "Wenn der Preis noch offen ist.",
    steps: [
      ["Erst fehlt der Preis.", { chip: [OPEN, "Offen"], when: "So 16.11. · 14:30 Uhr", route: "Flughafen München → Mayrhofen", load: "3 Personen · 3 Koffer · Limousine", price: ["offen", "Angebote erwünscht"] }],
      ["Dann kommen Angebote.", { chip: [OPEN, "3 Angebote"], when: "So 16.11. · 14:30 Uhr", route: "Flughafen München → Mayrhofen", load: "3 Personen · 3 Koffer · Limousine", price: ["offen", "Angebote erwünscht"], offers: [["Zillertal Transfer", "265 €"], ["Alpen Taxi Innsbruck", "280 €"], ["Kufsteiner Mietwagen", "295 €"]] }],
      ["Dann wählen Sie.", { chip: [TAKEN, "Vergeben"], when: "So 16.11. · 14:30 Uhr", route: "Flughafen München → Mayrhofen", load: "3 Personen · 3 Koffer · Limousine", price: ["265 €", "Angebot angenommen"], lines: ["Übernommen von Zillertal Transfer"] }],
      ["Dann steht der Preis schwarz auf weiß da.", { chip: [OK, "Erledigt"], when: "So 16.11. · 14:30 Uhr", route: "Flughafen München → Mayrhofen", load: "3 Personen · 3 Koffer · Limousine", price: ["265 €", "Angebot angenommen"], lines: ["Übernommen von Zillertal Transfer"], doc: true }],
    ],
  },
  {
    id: "verspaetung",
    title: "Wenn der Flug später landet.",
    steps: [
      ["Erst ist alles ausgemacht.", { chip: [TAKEN, "Vergeben"], when: "Sa 15.11. · 11:00 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Flug OS 112, Landung 10:05"] }],
      ["Dann landet der Flug später.", { chip: [OPEN, "Geändert"], when: "Sa 15.11. · 12:15 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Flug OS 112, Landung 11:40"] }],
      ["Dann sehen beide Seiten die neue Zeit.", { chip: [TAKEN, "Vergeben"], when: "Sa 15.11. · 12:15 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Flug OS 112, Landung 11:40", "Zeit vom Auftraggeber geändert, vom Unternehmen gesehen"] }],
      ["Dann ist die Fahrt gefahren.", { chip: [OK, "Erledigt"], when: "Sa 15.11. · 12:15 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Flug OS 112, Landung 11:40"], doc: true }],
    ],
  },
];

function FlowCard({ t, c }: { t: T; c: CardSpec }) {
  return (
    <div className="hp-card hp-order" data-ui>
      <div className="hp-order-top">
        <span className={`hp-chip ${c.chip[0]}`}>{t(c.chip[1])}</span>
        <span className="hp-muted">{c.when.split(" · ").map((x) => t(x)).join(" · ")}</span>
      </div>
      <p className="hp-order-route">{c.route.split(" → ").map((x) => t(x)).join(" → ")}</p>
      <p className="hp-muted">{t(c.load)}</p>
      {c.offers && (
        <ul className="hp-offers">
          {c.offers.map(([name, sum]) => <li key={name}><span>{name}</span><b>{sum}</b></li>)}
        </ul>
      )}
      {c.price[0] && <div className="hp-order-price"><b>{t(c.price[0])}</b><span>{t(c.price[1])}</span></div>}
      {c.lines?.map((l) => <p key={l} className="hp-order-by is-on">{t(l)}</p>)}
      {c.doc && <p className="hp-order-doc">{t("Bestätigung")} · TB-2411-0187.pdf</p>}
    </div>
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
  const price = formatCents(PLANS[0].priceCents, locale);
  const claim = {
    open: t("Offen"), taken: t("Vergeben"), when: `${t("Sa 15.11.")} · ${t("11:00 Uhr")}`,
    route: `${t("Flughafen München")} → Kitzbühel`, load: t("6 Personen · 6 Koffer · 4 Paar Ski · Kleinbus"),
    fixed: t("Festpreis"), claim: t("Zum Festpreis übernehmen"), reset: t("Zurücksetzen"),
    by: t("Übernommen von {name}", { name: "Alpen Taxi Innsbruck" }), hint: t("Probieren Sie es aus: Die Fahrt übernehmen."),
  };
  const email = "transferborsatirol@gmail.com";
  const statements: [string, string, string, string][] = [
    ["Festpreis oder Angebot", "Das erste geprüfte Unternehmen übernimmt direkt und verbindlich, oder Unternehmen geben Angebote ab.", "st-1", ""],
    ["Nur geprüfte Unternehmen.", "Konzession, Versicherung und Firmendaten sind vorab geprüft.", "st-2", "mirror"],
    ["Fahrgastdaten bleiben privat", "Namen und Nummern sieht nur, wer die Fahrt übernimmt.", "st-3", ""],
    ["Bestätigung als PDF", "Preis, Gepäck und Stornobedingungen stehen mit jeder Buchung schwarz auf weiß da.", "st-4", "mirror"],
  ];
  const verbs: [string, string, string, string][] = [
    ["Abgeben.", "Ein Kollege hat die Fahrt, aber keinen Wagen frei. Er stellt sie einmal in die Börse.", "/landing/tirol/arlberg-gipfel.jpg", "vb-ink"],
    ["Übernehmen.", "Wer frei hat, übernimmt zum Festpreis. Für alle anderen ist die Fahrt weg.", "/landing/tirol/mayrhofen-abend.jpg", "vb-paper"],
    ["Bestätigen.", "Preis, Flug und Gepäck stehen in der Bestätigung. Dann wird gefahren.", "/landing/tirol/innsbruck-hofgasse.jpg", "vb-paper vb-dim"],
  ];
  return (
    <div className="hp">
      {/* Erste Seite: ein Foto, der Titel im Himmel, der Satz in zwei Hälften um den Gipfel */}
      <section className="hp-hero" aria-labelledby="hp-title">
        <Photo className="hp-hero-img hp-shutter" src="/landing/tirol/st-anton-gipfel.jpg" alt={t("Schneebedeckte Gipfel über den Wolken in den Tiroler Alpen")} w={1800} h={1440} eager />
        <header className="hh-bar">
          <Link href="/" className="hh-logo" aria-label="Transferborsa"><Logo mono /></Link>
          <nav className="hh-nav" aria-label={t("Abschnitte")}>
            <a href="#ablauf">{t("Ablauf")}</a>
            <a href="#strecken">{t("Strecken")}</a>
            <Link href="/preise">{t("Preise")}</Link>
            <a href="#fragen">{t("Fragen")}</a>
          </nav>
          <div className="hh-end">
            <LangSwitch path="/" className="hp-lang" />
            {!appHref && <Link href="/login" className="hh-login">{t("Anmelden")}</Link>}
            <Link href={appHref ?? "/register?type=TRANSPORT_COMPANY"} className="hh-action">{appHref ? t("Zur App") : t("Registrieren")}</Link>
          </div>
        </header>
        <h1 id="hp-title" className="hh-title"><span>{t("Abgeben.")}</span><span>{t("Übernehmen.")}</span></h1>
        <div className="hh-halves">
          <p className="hh-a"><span>{t("Fahrten weitergeben, die Sie selbst nicht schaffen.")}</span></p>
          <p className="hh-b"><span>{t("Aufträge übernehmen, wenn Wagen frei sind.")}</span></p>
        </div>
        <div className="hh-foot">
          <p className="hh-note"><span>{t("Das Transfernetzwerk für Taxi- und Mietwagenunternehmen.")}</span></p>
          <Link href={appHref ?? "/register?type=TRANSPORT_COMPANY"} className="hp-btn hh-cta">{appHref ? t("Zur App") : t("Unternehmen registrieren")}</Link>
        </div>
      </section>

      {/* Text: eine Lesespalte auf der Achse, jeder Absatz mit einem Beweis aus der App */}
      <section id="ablauf" className="hp-swap" aria-labelledby="hp-wa">
        <h2 id="hp-wa">{t("Aus der Gruppe wird ein Auftrag.")}</h2>
        <p className="hp-lead">{t("Samstag, Hauptanreise, alle Busse sind unterwegs. Statt fünf Kollegen anzurufen, stellen Sie die Fahrt hier ein.")} <strong>{t("Wer frei hat, übernimmt.")}</strong></p>
        <ol className="hp-shift">
          {SHIFT.map(([was, wird]) => (
            <li key={was}>
              <s>{t(was)}</s>
              <b>{t(wird)}</b>
            </li>
          ))}
        </ol>
      </section>

      <section className="hp-text hp-read" aria-labelledby="hp-so">
        <div className="hp-axis-head"><h2 id="hp-so">{t("So läuft eine Fahrt.")}</h2></div>
        <div className="hp-col">
          <div className="hp-step">
            <p><b>{t("Bisher läuft es so.")}</b> {t("Die Fahrt geht in die Gruppe, drei Kollegen antworten halb, Preis und Gepäck bleiben mündlich.")}</p>
            <div className="hp-proof"><ChatScene t={t} /></div>
          </div>
          <div className="hp-step">
            <p><b>{t("Mit Transferborsa stellen Sie die Fahrt einmal ein.")}</b> {t("Alle geprüften Kollegen sehen sie, mit Zeit, Gepäck und Festpreis.")}</p>
            <div className="hp-proof"><ClaimOrder L={claim} /></div>
          </div>
          <div className="hp-step">
            <p><b>{t("Einer übernimmt,")}</b> {t("und für alle anderen ist die Fahrt weg. Niemand fragt mehr, wer zugesagt hat.")}</p>
            <div className="hp-proof"><FlowCard t={t} c={FLOWS[0].steps[1][1]} /></div>
          </div>
          <div className="hp-step">
            <p><b>{t("Danach steht alles schriftlich da.")}</b> {t("Preis, Flug, Gepäck und Stornobedingungen in einer Bestätigung als PDF.")}</p>
            <div className="hp-proof"><Confirmation t={t} /></div>
          </div>
        </div>
      </section>

      {/* Drei Verben, ein Foto je Schritt; das Verb bleibt in der Mitte, während das Bild vorbeizieht */}
      <section className="hp-verbs" aria-label={t("So läuft eine Fahrt.")}>
        {verbs.map(([verb, text, src, cls]) => (
          <div key={verb} className={`hp-verb ${cls}`}>
            <Photo src={src} w={1800} h={1200} />
            <div className="hp-verb-word"><p aria-hidden="true">{t(verb)}</p></div>
            <h2 className="hp-sr">{t(verb)}</h2>
            <p className="hp-verb-text">{t(text)}</p>
          </div>
        ))}
      </section>

      {/* Vier Aussagen auf Farbfeldern, fast leer */}
      <section className="hp-states" aria-label={t("Funktionen")}>
        {statements.map(([phrase, text, id, mirror]) => (
          <div key={id} className={`hp-state ${id} ${mirror}`}>
            <p className="hp-state-text">{t(text)}</p>
            <h2>{t(phrase)}</h2>
          </div>
        ))}
      </section>

      {FLOWS.map((f) => <FlowBand key={f.id} f={f} t={t} />)}

      <section id="strecken" className="hp-text" aria-labelledby="hp-strecken">
        <div className="hp-axis-head"><h2 id="hp-strecken">{t("Die Strecken, auf denen wir anfangen")}</h2></div>
        <div className="hp-col hp-col-wide">
          <table className="hp-routes">
            <tbody>
              {ROUTES.map(([route, time]) => (
                <tr key={route}><td>{t(route)}</td><td>{t(time)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="hp-small">{t("Salzburg, Zürich und Südtirol folgen, sobald dort regelmäßig Fahrten vermittelt werden.")}</p>
        </div>
      </section>

      {/* Der Preis als Satz: die Zahl ist ein Körper in der Zeile */}
      <section className="hp-price" aria-labelledby="hp-preis">
        <h2 id="hp-preis" className="hp-sentence">
          {t("Ab")} <mark>{price}</mark><br />{t("im Monat.")} {t("Ohne Provision.")}
        </h2>
        <div className="hp-price-foot">
          <p>{t("Fester Monatspreis per Rechnung für Taxi- und Transferunternehmen. Für Reisebüros und Hotels ist die Nutzung kostenlos.")}</p>
          <div>
            <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn">{t("Unternehmen registrieren")}</Link>
            <Link href="/register?type=TRAVEL_AGENCY" className="hp-link">{t("Reisebüro oder Hotel? Kostenlos registrieren")}</Link>
          </div>
        </div>
      </section>

      <section className="hp-steps" aria-labelledby="hp-schritte">
        <h2 id="hp-schritte">{t("In drei Schritten dabei.")}</h2>
        <div className="hp-steps-row">
          <div><h3>{t("Registrieren")}</h3><p>{t("Firmendaten angeben, kostenlos im Pilotbetrieb.")}</p></div>
          <div><h3>{t("Unternehmensprüfung")}</h3><p>{t("Wir prüfen Konzession, Versicherung und Firmendaten.")}</p></div>
          <div><h3>{t("Zugang zur Börse")}</h3><p>{t("Fahrten einstellen, übernehmen und bestätigen.")}</p></div>
        </div>
      </section>

      {/* Fragen groß links, Antworten daneben, alles offen */}
      <section id="fragen" className="hp-faq" aria-labelledby="hp-fragen">
        <div className="hp-faq-row hp-faq-head"><h2 id="hp-fragen">{t("Häufige Fragen")}</h2></div>
        {FAQ.map(([q, a]) => (
          <div key={q} className="hp-faq-row">
            <h3>{t(q)}</h3>
            <p>{t(a)}</p>
          </div>
        ))}
      </section>

      {/* Schluss: eine Frage an beiden Rändern, dazwischen die Wahl */}
      <section className="hp-ask" aria-labelledby="hp-wer">
        <h2 id="hp-wer"><span>{t("Taxi oder")}</span><span>{t("Reisebüro?")}</span></h2>
        <div className="hp-ask-row">
          <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn">{t("Unternehmen registrieren")}</Link>
          <span>{t("oder")}</span>
          <Link href="/register?type=TRAVEL_AGENCY" className="hp-btn hp-btn-paper">{t("Reisebüro oder Hotel registrieren")}</Link>
        </div>
        <p className="hp-ask-note">{t("Wir sind im Pilotbetrieb rund um Innsbruck und melden uns persönlich.")}</p>
      </section>

      <footer className="hp-footer">
        <div className="hp-foot-top">
          <p>{t("Die Börse für Taxi- und Transferunternehmen in Tirol.")}</p>
          <p><a className="hp-mail" href={`mailto:${email}?subject=Transferborsa`}>{email}</a></p>
          <a href="#hp-title">{t("Nach oben")}</a>
        </div>
        <p className="hp-wordmark" aria-hidden="true">Transferborsa</p>
        <div className="hp-foot-meta">
          <ul>
            <li><Link href="/preise">{t("Preise")}</Link></li>
            <li><Link href="/impressum">{t("Impressum")}</Link></li>
            <li><Link href="/datenschutz">{t("Datenschutz")}</Link></li>
            <li><Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link></li>
          </ul>
          <p>{t("Fotos: Erich Fend, Jonathan Bean, Linas Bam (Unsplash), Leonhard Lenz (alle CC0)")}</p>
          <p>Innsbruck · 2026</p>
        </div>
      </footer>
    </div>
  );
}

/** Eine volle Seite aus vier Feldern ohne Lücke: dieselbe Karte, jedes Mal ein Stück weiter. */
function FlowBand({ f, t }: { f: Flow; t: T }) {
  return (
    <section className="hp-flow" aria-labelledby={`hp-flow-${f.id}`}>
      <div className="hp-flow-head"><h2 id={`hp-flow-${f.id}`}>{t(f.title)}</h2></div>
      <div className="hp-cells">
        {f.steps.map(([clause, card], i) => (
          <div key={clause} className={`hp-cell cell-${i + 1}`}>
            <FlowCard t={t} c={card} />
            <p className="hp-clause">{t(clause)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
