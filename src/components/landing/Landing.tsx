import { Logo } from "../Logo";
import Link from "next/link";
import { Fragment } from "react";
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
  {
    id: "leerfahrt",
    title: "Wenn der Bus leer zurückfährt.",
    steps: [
      ["Erst fährt er leer zurück.", { chip: [OK, "Frei"], when: "Sa 15.11. · ab 15:00 Uhr", route: "Kitzbühel → Flughafen München", load: "Kleinbus · 8 Plätze · Skiträger", price: ["", ""], lines: ["Angeboten von Alpen Taxi Innsbruck"] }],
      ["Dann fragt jemand an.", { chip: [OPEN, "Angefragt"], when: "Sa 15.11. · 15:00 Uhr", route: "Kitzbühel → Flughafen München", load: "5 Personen · 5 Koffer", price: ["", ""], lines: ["Anfrage von Hotel Alpenrose"] }],
      ["Dann ist er gebucht.", { chip: [TAKEN, "Vergeben"], when: "Sa 15.11. · 15:00 Uhr", route: "Kitzbühel → Flughafen München", load: "5 Personen · 5 Koffer", price: ["190 €", "Festpreis"], lines: ["Übernommen von Alpen Taxi Innsbruck"], doc: true }],
      ["Dann fährt er nicht mehr leer.", { chip: [OK, "Erledigt"], when: "Sa 15.11. · 15:00 Uhr", route: "Kitzbühel → Flughafen München", load: "5 Personen · 5 Koffer", price: ["190 €", "Festpreis"], lines: ["Übernommen von Alpen Taxi Innsbruck"], doc: true }],
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

/**
 * Eine Auftragsansicht in sechs Feldern, wie eine Tafel im Handbuch. Rechts und links stehen die Randnotizen,
 * jede auf Höhe ihres Feldes (gleiche Gitterzeile).
 */
function Plate({ t }: { t: T }) {
  const notes: [string, string][] = [
    ["Strecke, Zeit, Gepäck", "Alles, was ein Kollege wissen muss, steht in der Anzeige."],
    ["Festpreis oder Angebot", "Das erste geprüfte Unternehmen übernimmt direkt und verbindlich, oder Unternehmen geben Angebote ab."],
    ["Geprüfter Auftraggeber", "Konzession, Versicherung und Firmendaten sind vorab geprüft."],
    ["Fahrgastdaten bleiben privat", "Namen und Nummern sieht nur, wer die Fahrt übernimmt."],
    ["Flugdaten im Auftrag", "Landung und Abholzeit stehen im selben Auftrag, Änderungen sehen beide Seiten."],
    ["Bestätigung als PDF", "Preis, Gepäck und Stornobedingungen stehen mit jeder Buchung schwarz auf weiß da."],
  ];
  const seg = [
    <div key="1" className="hp-seg">
      <div className="hp-order-top"><span className="hp-chip hp-chip-open">{t("Offen")}</span><span className="hp-muted">{t("Sa 15.11.")} · {t("11:00 Uhr")}</span></div>
      <p className="hp-order-route">{t("Flughafen München")} → Kitzbühel</p>
      <p className="hp-muted">{t("6 Personen · 6 Koffer · 4 Paar Ski · Kleinbus")}</p>
    </div>,
    <div key="2" className="hp-seg">
      <div className="hp-order-price"><b>310 €</b><span>{t("Festpreis")}</span></div>
      <div className="hp-order-actions">
        <span className="hp-fake hp-fake-primary">{t("Zum Festpreis übernehmen")}</span>
        <span className="hp-fake">{t("Angebot abgeben")}</span>
      </div>
    </div>,
    <div key="3" className="hp-seg">
      <p className="hp-key">{t("Auftraggeber")}</p>
      <p><b>Alpen Taxi Innsbruck</b></p>
      <div className="hp-badges"><span className="hp-chip hp-chip-ok">{t("Konzession geprüft")}</span><span className="hp-chip hp-chip-ok">{t("Versicherung geprüft")}</span></div>
    </div>,
    <div key="4" className="hp-seg">
      <p className="hp-key">{t("Fahrgast")}</p>
      <p className="hp-masked" aria-hidden="true">●●●●●● ●●●●●●●</p>
      <p className="hp-muted">{t("Nach der Übernahme sichtbar")}</p>
    </div>,
    <div key="5" className="hp-seg">
      <p className="hp-key">{t("Flug")}</p>
      <p><b>OS 112</b> · {t("Landung 10:05")} · {t("Abholung 11:00")}</p>
    </div>,
    <div key="6" className="hp-seg">
      <p className="hp-key">{t("Bestätigung")}</p>
      <p className="hp-order-doc">TB-2411-0187.pdf</p>
      <p className="hp-muted">{t("Storno bis 24 h vorher kostenlos")}</p>
    </div>,
  ];
  return (
    <div className="hp-plate" data-ui>
      {notes.map(([name, text], i) => (
        <Fragment key={name}>
          <div className={`hp-note ${i % 2 === 0 ? "n-l" : "n-r"}`} data-n={i + 1} style={{ gridRow: i + 1 }} tabIndex={0}>
            <b>{t(name)}</b>
            <p>{t(text)}</p>
          </div>
          <div className="hp-seg-wrap" data-n={i + 1} style={{ gridRow: i + 1 }}>{seg[i]}</div>
        </Fragment>
      ))}
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
  return (
    <div className="hp">
      {/* Erste Seite: Brett aus zwei mal zwei, oben eine Zeile aus Kacheln */}
      <section className="hp-hero" aria-labelledby="hp-title">
        <div className="hb-top">
          <Link href="/" className="hb-logo" aria-label="Transferborsa"><Logo iconOnly /></Link>
          <nav className="hb-nav" aria-label={t("Abschnitte")}>
            <a href="#ablauf">{t("Ablauf")}</a>
            <a href="#strecken">{t("Strecken")}</a>
            <Link href="/preise">{t("Preise")}</Link>
            <a href="#fragen">{t("Fragen")}</a>
            <span className="hb-nav-end">
              <LangSwitch path="/" className="hp-lang" />
              {!appHref && <Link href="/login">{t("Anmelden")}</Link>}
            </span>
          </nav>
          {appHref
            ? <Link href={appHref} className="hb-action">{t("Zur App")}</Link>
            : <Link href="/register?type=TRANSPORT_COMPANY" className="hb-action">{t("Registrieren")}</Link>}
        </div>
        <div className="hb-name">
          <h1 id="hp-title"><span>{t("Abgeben.")}</span> <span>{t("Übernehmen.")}</span></h1>
        </div>
        <div className="hb-photo hb-photo-a"><Photo className="hp-shutter" src="/landing/kitzbuehel.webp" alt={t("Die Vorderstadt von Kitzbühel im Winter")} w={1600} h={1067} eager /></div>
        <div className="hb-photo hb-photo-b"><Photo src="/landing/alpen.webp" alt={t("Eine Passstraße in den Tiroler Alpen")} w={1600} h={1067} eager /></div>
        <div className="hb-dark">
          <p>{t("Das Transfernetzwerk für Taxi- und Mietwagenunternehmen.")}</p>
        </div>
        <div className="hb-accent">
          <p>{t("Fahrten weitergeben, die Sie selbst nicht schaffen. Aufträge übernehmen, wenn Wagen frei sind.")}</p>
          <Link href="/register?type=TRAVEL_AGENCY" className="hp-link">{t("Reisebüro oder Hotel? Kostenlos registrieren")}</Link>
        </div>
      </section>

      {/* Text: eine Lesespalte auf der Achse, jeder Absatz mit einem Beweis aus der App */}
      <section id="ablauf" className="hp-text" aria-labelledby="hp-wa">
        <div className="hp-axis-head"><h2 id="hp-wa">{t("Aus der Gruppe wird ein Auftrag.")}</h2></div>
        <div className="hp-col">
          <p><b>{t("Bisher läuft es so.")}</b> {t("Die Fahrt geht in die Gruppe, drei Kollegen antworten halb, Preis und Gepäck bleiben mündlich.")}</p>
          <div className="hp-proof"><ChatScene t={t} /></div>
          <p><b>{t("Mit Transferborsa stellen Sie die Fahrt einmal ein.")}</b> {t("Alle geprüften Kollegen sehen sie, mit Zeit, Gepäck und Festpreis.")}</p>
          <div className="hp-proof"><ClaimOrder L={claim} /></div>
          <p><b>{t("Einer übernimmt,")}</b> {t("und für alle anderen ist die Fahrt weg. Niemand fragt mehr, wer zugesagt hat.")}</p>
          <div className="hp-proof"><FlowCard t={t} c={FLOWS[0].steps[1][1]} /></div>
          <p><b>{t("Danach steht alles schriftlich da.")}</b> {t("Preis, Flug, Gepäck und Stornobedingungen in einer Bestätigung als PDF.")}</p>
          <div className="hp-proof"><Confirmation t={t} /></div>
        </div>
      </section>

      {FLOWS.slice(0, 1).map((f) => <FlowBand key={f.id} f={f} t={t} />)}

      {/* Tafel: eine Auftragsansicht mit Randnotizen */}
      <section className="hp-text hp-plate-sec" aria-labelledby="hp-tafel">
        <div className="hp-axis-head hp-center"><h2 id="hp-tafel">{t("Jedes Feld hat seinen Zweck.")}</h2></div>
        <Plate t={t} />
      </section>

      {FLOWS.slice(1).map((f) => <FlowBand key={f.id} f={f} t={t} />)}

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

      {/* Zwei Felder, wo sonst Tarife stünden: für wen und was es kostet */}
      <section className="hp-fields" aria-label={t("Für beide Seiten der Fahrt.")}>
        <div className="hp-field hp-field-a">
          <h2>{t("Reisebüros und Hotels")}</h2>
          <p>{t("Transfers für Ihre Gäste einstellen und sehen, wer sie übernimmt. Mit Bestätigung für jede Buchung.")}</p>
          <div className="hp-field-foot">
            <p className="hp-figure">{t("Kostenlos")}</p>
            <Link href="/register?type=TRAVEL_AGENCY" className="hp-btn">{t("Registrieren")}</Link>
          </div>
        </div>
        <div className="hp-field hp-field-b">
          <h2>{t("Taxi- und Transferunternehmen")}</h2>
          <p>{t("Fahrten weitergeben, die Sie nicht schaffen. Aufträge übernehmen, wenn Wagen frei sind. Leerfahrten füllen.")}</p>
          <div className="hp-field-foot">
            <p className="hp-figure">{t("Ab {price}", { price })}<small>{t("im Monat, ohne Provision pro Fahrt")}</small></p>
            <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn hp-btn-navy">{t("Unternehmen registrieren")}</Link>
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

      <section id="fragen" className="hp-faq" aria-labelledby="hp-fragen">
        <div className="hp-faq-head"><h2 id="hp-fragen">{t("Häufige Fragen")}</h2></div>
        {FAQ.map(([q, a]) => (
          <div key={q} className="hp-faq-band">
            <h3>{t(q)}</h3>
            <p>{t(a)}</p>
          </div>
        ))}
      </section>

      <section className="hp-close" aria-labelledby="hp-kontakt">
        <div className="hp-strip">
          <Photo src="/landing/kitzbuehel.webp" w={1600} h={1067} />
          <Photo src="/landing/innsbruck.webp" w={1280} h={720} />
          <Photo src="/landing/alpen.webp" w={1600} h={1067} />
        </div>
        <div className="hp-close-band">
          <h2 id="hp-kontakt" className="hp-lede">{t("Wir sind im Pilotbetrieb rund um Innsbruck und melden uns persönlich.")} <a href={`mailto:${email}?subject=Transferborsa`}>{t("Schreiben Sie uns.")}</a></h2>
          <p className="hp-small">{t("Fragen zur Börse, zur Prüfung oder zu den Strecken beantworten wir gern.")}</p>
        </div>
      </section>

      <footer className="hp-footer">
        <div className="hp-foot-top">
          <p><b>Transferborsa</b></p>
          <p>{t("Die Börse für Taxi- und Transferunternehmen in Tirol.")}</p>
          <a href="#hp-title">{t("Nach oben")}</a>
        </div>
        <a className="hp-mail" href={`mailto:${email}?subject=Transferborsa`}>transferborsatirol<wbr />@gmail.com</a>
        <div className="hp-foot-meta">
          <ul>
            <li><Link href="/preise">{t("Preise")}</Link></li>
            <li><Link href="/impressum">{t("Impressum")}</Link></li>
            <li><Link href="/datenschutz">{t("Datenschutz")}</Link></li>
            <li><Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link></li>
          </ul>
          <p>{t("Fotos: Shpetim Ujkani, Jonas Tebbe (Unsplash), TheTokl (CC BY-SA 4.0)")}</p>
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
