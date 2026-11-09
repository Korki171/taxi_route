import { Logo } from "../Logo";
import Link from "next/link";
import type { ReactNode } from "react";
import "@fontsource-variable/albert-sans";
import "./home.css";
import { LangSwitch } from "../LangSwitch";
import { ClaimOrder } from "./ClaimOrder";
import { getI18n } from "@/server/i18n";
import { formatCents } from "@/lib/money";
import { PLANS } from "@/lib/plans";

// Startseite „Das Brett“ (Richtung dense-tiles aus taste-skill; Vorbilder für den Inhalt: caporide.com, timocom.de).
// Idee: Die Börse ist ein Brett offener Fahrten, also ist die Seite ein Brett. Jede Kachel ist ein echtes Stück der
// App (Fahrt, Chat, Bestätigung, Unternehmensliste) oder eine Aussage. Die lebendige Stelle: eine Fahrt übernehmen.
// Alle Namen und Fahrten in den Beispielen sind erfunden.

/** Strecken mit ungefährer Fahrzeit ab Flughafen München (Werte wie in der App). */
const ROUTES: [string, string][] = [
  ["Flughafen München → Innsbruck", "ca. 1 h 50 min"],
  ["Flughafen München → Kitzbühel", "ca. 1 h 40 min"],
  ["Flughafen München → Mayrhofen", "ca. 2 h"],
  ["Flughafen München → Sölden", "ca. 2 h 30 min"],
  ["Innsbruck → Seefeld, Hall, Kufstein, St. Anton", "regional"],
];

const AFTER = [
  "Einmal einstellen, alle geprüften Kollegen sehen es",
  "Einer übernimmt, die anderen sehen: weg",
  "Preis, Flug und Gepäck stehen in der Bestätigung (PDF)",
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

function Tick() {
  return (
    <svg className="hp-tick" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

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

/** Eine Karte der Börse in einem Zwischenstand; die Abläufe unten zeigen dieselbe Karte Schritt für Schritt. */
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

type Flow = { id: string; title: string; steps: { card: CardSpec; clause: string; cls: string }[] };
const COLORS = ["c-white", "c-stone", "c-navy", "c-orange"];

const FLOWS: Flow[] = [
  {
    id: "fahrt",
    title: "So läuft eine Fahrt.",
    steps: [
      { clause: "Erst wird sie eingestellt.", card: { chip: [OPEN, "Offen"], when: "Sa 15.11. · 11:00 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"] } },
      { clause: "Dann übernimmt jemand.", card: { chip: [TAKEN, "Vergeben"], when: "Sa 15.11. · 11:00 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Übernommen von Alpen Taxi Innsbruck"] } },
      { clause: "Dann steht alles schriftlich da.", card: { chip: [TAKEN, "Vergeben"], when: "Sa 15.11. · 11:00 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Übernommen von Alpen Taxi Innsbruck"], doc: true } },
      { clause: "Dann ist die Fahrt erledigt.", card: { chip: [OK, "Erledigt"], when: "Sa 15.11. · 11:00 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Übernommen von Alpen Taxi Innsbruck"], doc: true } },
    ].map((x, i) => ({ ...x, cls: COLORS[i] })),
  },
  {
    id: "angebote",
    title: "Wenn der Preis noch offen ist.",
    steps: [
      { clause: "Erst fehlt der Preis.", card: { chip: [OPEN, "Offen"], when: "So 16.11. · 14:30 Uhr", route: "Flughafen München → Mayrhofen", load: "3 Personen · 3 Koffer · Limousine", price: ["offen", "Angebote erwünscht"] } },
      { clause: "Dann kommen Angebote.", card: { chip: [OPEN, "3 Angebote"], when: "So 16.11. · 14:30 Uhr", route: "Flughafen München → Mayrhofen", load: "3 Personen · 3 Koffer · Limousine", price: ["offen", "Angebote erwünscht"], offers: [["Zillertal Transfer", "265 €"], ["Alpen Taxi Innsbruck", "280 €"], ["Kufsteiner Mietwagen", "295 €"]] } },
      { clause: "Dann wählen Sie.", card: { chip: [TAKEN, "Vergeben"], when: "So 16.11. · 14:30 Uhr", route: "Flughafen München → Mayrhofen", load: "3 Personen · 3 Koffer · Limousine", price: ["265 €", "Angebot angenommen"], lines: ["Übernommen von Zillertal Transfer"] } },
      { clause: "Dann steht der Preis schwarz auf weiß da.", card: { chip: [OK, "Erledigt"], when: "So 16.11. · 14:30 Uhr", route: "Flughafen München → Mayrhofen", load: "3 Personen · 3 Koffer · Limousine", price: ["265 €", "Angebot angenommen"], lines: ["Übernommen von Zillertal Transfer"], doc: true } },
    ].map((x, i) => ({ ...x, cls: COLORS[i] })),
  },
  {
    id: "verspaetung",
    title: "Wenn der Flug später landet.",
    steps: [
      { clause: "Erst ist alles ausgemacht.", card: { chip: [TAKEN, "Vergeben"], when: "Sa 15.11. · 11:00 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Flug OS 112, Landung 10:05"] } },
      { clause: "Dann landet der Flug später.", card: { chip: [OPEN, "Geändert"], when: "Sa 15.11. · 12:15 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Flug OS 112, Landung 11:40"] } },
      { clause: "Dann sehen beide Seiten die neue Zeit.", card: { chip: [TAKEN, "Vergeben"], when: "Sa 15.11. · 12:15 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Flug OS 112, Landung 11:40", "Zeit vom Auftraggeber geändert, vom Unternehmen gesehen"] } },
      { clause: "Dann ist die Fahrt gefahren.", card: { chip: [OK, "Erledigt"], when: "Sa 15.11. · 12:15 Uhr", route: RUN, load: LOAD, price: ["310 €", "Festpreis"], lines: ["Flug OS 112, Landung 11:40"], doc: true } },
    ].map((x, i) => ({ ...x, cls: COLORS[i] })),
  },
  {
    id: "leerfahrt",
    title: "Wenn der Bus leer zurückfährt.",
    steps: [
      { clause: "Erst fährt er leer zurück.", card: { chip: [OK, "Frei"], when: "Sa 15.11. · ab 15:00 Uhr", route: "Kitzbühel → Flughafen München", load: "Kleinbus · 8 Plätze · Skiträger", price: ["", ""], lines: ["Angeboten von Alpen Taxi Innsbruck"] } },
      { clause: "Dann fragt jemand an.", card: { chip: [OPEN, "Angefragt"], when: "Sa 15.11. · 15:00 Uhr", route: "Kitzbühel → Flughafen München", load: "5 Personen · 5 Koffer", price: ["", ""], lines: ["Anfrage von Hotel Alpenrose"] } },
      { clause: "Dann ist er gebucht.", card: { chip: [TAKEN, "Vergeben"], when: "Sa 15.11. · 15:00 Uhr", route: "Kitzbühel → Flughafen München", load: "5 Personen · 5 Koffer", price: ["190 €", "Festpreis"], lines: ["Übernommen von Alpen Taxi Innsbruck"], doc: true } },
      { clause: "Dann fährt er nicht mehr leer.", card: { chip: [OK, "Erledigt"], when: "Sa 15.11. · 15:00 Uhr", route: "Kitzbühel → Flughafen München", load: "5 Personen · 5 Koffer", price: ["190 €", "Festpreis"], lines: ["Übernommen von Alpen Taxi Innsbruck"], doc: true } },
    ].map((x, i) => ({ ...x, cls: COLORS[i] })),
  },
];

function FlowCard({ t, c }: { t: T; c: CardSpec }) {
  return (
    <div className="hp-card hp-order hp-order-sm" data-ui>
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
      {c.lines?.map((l) => <p key={l} className="hp-order-by">{t(l)}</p>)}
      {c.doc && <p className="hp-order-doc">{t("Bestätigung")} · TB-2411-0187.pdf</p>}
    </div>
  );
}

function CompanyList({ t }: { t: T }) {
  const rows: [string, string][] = [
    ["Alpen Taxi Innsbruck", "Innsbruck"],
    ["Kufsteiner Mietwagen", "Kufstein"],
    ["Zillertal Transfer", "Mayrhofen"],
  ];
  return (
    <div className="hp-card hp-companies" data-ui aria-label={t("Beispiel: geprüfte Unternehmen")}>
      {rows.map(([name, city]) => (
        <div key={name} className="hp-company">
          <div>
            <b>{name}</b>
            <span className="hp-muted">{city}</span>
          </div>
          <div className="hp-badges">
            <span className="hp-chip hp-chip-ok">{t("Konzession geprüft")}</span>
            <span className="hp-chip hp-chip-ok">{t("Versicherung geprüft")}</span>
          </div>
        </div>
      ))}
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

/** Eine Kachel des Bretts. `cls` setzt Platz und Farbe (home.css). */
function Tile({ cls, children }: { cls: string; children: ReactNode }) {
  return <div className={`t ${cls}`}>{children}</div>;
}

export async function Landing({ appHref }: { appHref?: string } = {}) {
  const { t, locale } = await getI18n();
  const shot = (name: string) => `/landing/app/${name}-${locale === "en" ? "en" : "de"}.webp`;
  const price = formatCents(PLANS[0].priceCents, locale);
  const claim = {
    open: t("Offen"), taken: t("Vergeben"), when: `${t("Sa 15.11.")} · ${t("11:00 Uhr")}`,
    route: `${t("Flughafen München")} → Kitzbühel`, load: t("6 Personen · 6 Koffer · 4 Paar Ski · Kleinbus"),
    fixed: t("Festpreis"), claim: t("Zum Festpreis übernehmen"), reset: t("Zurücksetzen"),
    by: t("Übernommen von {name}", { name: "Alpen Taxi Innsbruck" }), hint: t("Probieren Sie es aus: Die Fahrt übernehmen."),
  };
  return (
    <div className="hp">
      <header className="hp-head">
        <div className="hp-top">
          <Link href="/" className="hp-logo" aria-label="Transferborsa"><Logo /></Link>
          <nav aria-label={t("Abschnitte")}>
            <a href="#ablauf" className="hp-hide-s">{t("Ablauf")}</a>
            <a href="#strecken" className="hp-hide-s">{t("Strecken")}</a>
            <Link href="/preise" className="hp-hide-s">{t("Preise")}</Link>
            <a href="#fragen" className="hp-hide-s">{t("Fragen")}</a>
          </nav>
          <div className="hp-top-end">
            <LangSwitch path="/" className="hp-lang" />
            {appHref
              ? <Link href={appHref} className="hp-btn hp-btn-light">{t("Zur App")}</Link>
              : <><Link href="/login" className="hp-hide-s">{t("Anmelden")}</Link><Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn hp-btn-light">{t("Registrieren")}</Link></>}
          </div>
        </div>
      </header>

      <main>
        {/* Erste Seite des Bretts: Name, Aussage, Aktion, zwei Blicke in die App */}
        <section className="bd bd-hero" aria-labelledby="hp-title">
          <Tile cls="h-name c-navy">
            <h1 id="hp-title">{t("Das Transfernetzwerk für Taxi- und Mietwagenunternehmen.")}</h1>
          </Tile>
          <Tile cls="h-say c-white">
            <p className="hp-say">{t("Fahrten weitergeben, die Sie selbst nicht schaffen. Aufträge übernehmen, wenn Wagen frei sind.")}</p>
          </Tile>
          <Tile cls="h-act c-orange">
            <div className="hp-actions">
              <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn hp-btn-navy">{t("Unternehmen registrieren")}</Link>
              <Link href="/register?type=TRAVEL_AGENCY" className="hp-link">{t("Reisebüro oder Hotel? Kostenlos registrieren")}</Link>
            </div>
            <p className="hp-small">{t("Wir sind im Pilotbetrieb rund um Innsbruck und melden uns persönlich.")}</p>
          </Tile>
          <Tile cls="h-web c-shot">
            <img className="hp-shutter" src={shot("boerse")} width={1600} height={1000} alt={t("Die Auftragsbörse mit offenen Fahrten, Filtern und Preisen")} decoding="async" />
          </Tile>
          <Tile cls="h-phone c-shot">
            <img src={shot("boerse-handy")} width={700} height={1515} alt={t("Die Auftragsbörse auf dem Handy")} loading="lazy" decoding="async" />
          </Tile>
        </section>

        {/* Gruppe → Auftrag, mit der lebendigen Stelle */}
        <section id="ablauf" className="bd bd-group" aria-labelledby="hp-wa">
          <Tile cls="g-text c-white">
            <h2 id="hp-wa">{t("Aus der Gruppe wird ein Auftrag.")}</h2>
            <p className="hp-body">{t("Samstag, Hauptanreise, alle Busse sind unterwegs. Statt fünf Kollegen anzurufen, stellen Sie die Fahrt hier ein.")} <strong>{t("Wer frei hat, übernimmt.")}</strong></p>
            <ul className="hp-checks">
              {AFTER.map((s) => <li key={s}><Tick />{t(s)}</li>)}
            </ul>
          </Tile>
          <Tile cls="g-chat c-stone"><ChatScene t={t} /></Tile>
          <Tile cls="g-live c-navy"><ClaimOrder L={claim} /></Tile>
        </section>

        {/* Was die Börse kann: Ausschnitte als Kacheln */}
        <section className="bd bd-features" aria-label={t("Funktionen")}>
          <Tile cls="f-price c-navy">
            <div className="hp-big" data-ui aria-hidden="true">
              <b>310 €</b>
              <span className="hp-chip hp-chip-open">{t("Festpreis")}</span>
            </div>
            <h2>{t("Festpreis oder Angebot.")}</h2>
            <p className="hp-body">{t("Wer die Fahrt einstellt, legt fest, wie sie vergeben wird. Beim Festpreis übernimmt das erste geprüfte Unternehmen direkt und verbindlich.")}</p>
          </Tile>
          <Tile cls="f-cos c-white">
            <CompanyList t={t} />
            <h2>{t("Nur geprüfte Unternehmen.")}</h2>
          </Tile>
          <Tile cls="f-pdf c-stone">
            <Confirmation t={t} />
            <h2>{t("Alles Schriftliche in einer Bestätigung.")}</h2>
          </Tile>
          <Tile cls="f-a c-white">
            <h3>{t("Keine Namen für Fremde")}</h3>
            <p className="hp-body">{t("Andere Teilnehmer sehen Strecke, Zeit, Personenzahl und Gepäck, aber keine Fahrgastdaten.")}</p>
          </Tile>
          <Tile cls="f-b c-stone">
            <h3>{t("Geprüft je Geschäftsfunktion")}</h3>
            <p className="hp-body">{t("Wer nur Fahrzeuge anbietet, wird anders geprüft als wer Aufträge übernimmt.")}</p>
          </Tile>
          <Tile cls="f-fee c-orange">
            <h3>{t("Keine Provision pro Fahrt")}</h3>
            <p className="hp-body">{t("Ab {price} im Monat für Taxiunternehmen, ohne Provision pro Fahrt. Für Reisebüros und Hotels kostenlos.", { price })}</p>
            <Link href="/preise" className="hp-link">{t("Alle Tarife ansehen")}</Link>
          </Tile>
        </section>

        {/* Abläufe: dieselbe Karte, jedes Mal ein Stück weiter */}
        {FLOWS.map((f, n) => (
          <section key={f.id} id={n === 0 ? "ablauf-fahrt" : undefined} className="bd bd-flow" aria-labelledby={`hp-flow-${f.id}`}>
            <Tile cls="s-head c-white"><h2 id={`hp-flow-${f.id}`}>{t(f.title)}</h2></Tile>
            {f.steps.map((st, i) => (
              <Tile key={st.clause} cls={`s s-${i + 1} ${st.cls}`}>
                <FlowCard t={t} c={st.card} />
                <p className="hp-clause">{t(st.clause)}</p>
              </Tile>
            ))}
          </section>
        ))}

        <section id="strecken" className="bd bd-routes" aria-labelledby="hp-strecken">
          <Tile cls="r-head c-navy">
            <h2 id="hp-strecken">{t("Die Strecken, auf denen wir anfangen")}</h2>
          </Tile>
          <Tile cls="r-table c-white">
            <table className="hp-routes">
              <tbody>
                {ROUTES.map(([route, time]) => (
                  <tr key={route}><td>{t(route)}</td><td>{t(time)}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="hp-small">{t("Salzburg, Zürich und Südtirol folgen, sobald dort regelmäßig Fahrten vermittelt werden.")}</p>
          </Tile>
        </section>

        <section className="bd bd-who" aria-labelledby="hp-wer">
          <Tile cls="w-head c-white"><h2 id="hp-wer">{t("Für beide Seiten der Fahrt.")}</h2></Tile>
          <Tile cls="w-a c-stone">
            <h3>{t("Taxi- und Transferunternehmen")}</h3>
            <p className="hp-body">{t("Fahrten weitergeben, die Sie nicht schaffen. Aufträge übernehmen, wenn Wagen frei sind. Leerfahrten füllen.")}</p>
            <p className="hp-small">{t("Fester Monatspreis, keine Provision pro Fahrt.")}</p>
          </Tile>
          <Tile cls="w-b c-white">
            <h3>{t("Reisebüros und Hotels")}</h3>
            <p className="hp-body">{t("Transfers für Ihre Gäste einstellen und sehen, wer sie übernimmt. Mit Bestätigung für jede Buchung.")}</p>
            <p className="hp-small">{t("Kostenlos.")}</p>
          </Tile>
        </section>

        <section className="bd bd-join" aria-labelledby="hp-schritte">
          <Tile cls="j-head c-navy"><h2 id="hp-schritte">{t("In drei Schritten dabei.")}</h2></Tile>
          <Tile cls="j-1 c-white"><h3>{t("Registrieren")}</h3><p className="hp-body">{t("Firmendaten angeben, kostenlos im Pilotbetrieb.")}</p></Tile>
          <Tile cls="j-2 c-stone"><h3>{t("Unternehmensprüfung")}</h3><p className="hp-body">{t("Wir prüfen Konzession, Versicherung und Firmendaten.")}</p></Tile>
          <Tile cls="j-3 c-white"><h3>{t("Zugang zur Börse")}</h3><p className="hp-body">{t("Fahrten einstellen, übernehmen und bestätigen.")}</p></Tile>
        </section>

        <section id="fragen" className="bd bd-faq" aria-labelledby="hp-fragen">
          <div className="q-head"><h2 id="hp-fragen">{t("Häufige Fragen")}</h2></div>
          <div className="q-list">
            {FAQ.map(([q, a]) => (
              <details key={q} name="hp-faq" className="t c-white">
                <summary>{t(q)}</summary>
                <p>{t(a)}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bd bd-cta" aria-labelledby="hp-kontakt">
          <Tile cls="x-l c-shot"><img src={shot("boerse")} width={1600} height={1000} alt="" loading="lazy" decoding="async" /></Tile>
          <Tile cls="x-main c-orange">
            <h2 id="hp-kontakt">{t("Fragen? Schreiben Sie uns.")}</h2>
            <p className="hp-body">{t("Wir sind im Pilotbetrieb rund um Innsbruck und melden uns persönlich.")}</p>
            <a className="hp-contact" href="mailto:transferborsatirol@gmail.com?subject=Transferborsa">transferborsatirol@gmail.com</a>
            <div className="hp-actions">
              <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn hp-btn-navy">{t("Unternehmen registrieren")}</Link>
            </div>
          </Tile>
          <Tile cls="x-r c-navy"><Logo iconOnly className="hp-icon" /></Tile>
        </section>
      </main>

      <footer className="hp-footer">
        <Logo className="hp-mark" />
        <ul>
          <li>Transferborsa · Innsbruck</li>
          <li><Link href="/preise">{t("Preise")}</Link></li>
          <li><Link href="/impressum">{t("Impressum")}</Link></li>
          <li><Link href="/datenschutz">{t("Datenschutz")}</Link></li>
          <li><Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link></li>
        </ul>
      </footer>
    </div>
  );
}
