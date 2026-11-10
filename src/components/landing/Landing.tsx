import { Logo } from "../Logo";
import Link from "next/link";
import "@fontsource-variable/albert-sans";
import "./fragments.css";
import "./home.css";
import { LangSwitch } from "../LangSwitch";
import { ClaimOrder } from "./ClaimOrder";
import { Stages } from "./Stages";
import { Showcase } from "./Showcase";
import { FaqIndex } from "./FaqIndex";
import { Crossfade } from "./Crossfade";
import { Start } from "./Start";
import { getI18n } from "@/server/i18n";
import { PLANS } from "@/lib/plans";

// Startseite, Komplett-Redesign 2026-11-10. Richtung „The product performs“ (taste-skill): wenig Seite, viel Produkt.
// Idee: Eine Fahrt, die ein Unternehmen nicht schafft, wird eine lebende Karte, die der Besucher selbst übernimmt.
// Eine Achse bei 27 % der Breite, App-Ausschnitte in echter Größe, ein Preis in groß, keine Navigationsleiste.
// Aufbau nach ui-skills (landing-page), Plan nach frontend-design, Typografie und Farbe nach impeccable,
// Bewegung nach emil-design-eng, Kontraste und Zielgrößen nach ui-ux-pro-max.
// Schrift: Albert Sans statt der gezogenen Clash Grotesk (nicht installiert; ein Fremd-CDN gäbe Besucher-IPs weiter).
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

function Check() {
  return (
    <svg className="hp-check" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

export async function Landing({ appHref }: { appHref?: string } = {}) {
  const { t, locale } = await getI18n();
  const plan = PLANS[0];
  const figure = (plan.priceCents / 100).toLocaleString(locale === "en" ? "en-GB" : "de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const claim = {
    open: t("Offen"), taken: t("Vergeben"), when: `${t("Sa 15.11.")} · ${t("11:00 Uhr")}`,
    route: `${t("Flughafen München")} → Kitzbühel`, load: t("6 Personen · 6 Koffer · 4 Paar Ski · Kleinbus"),
    fixed: t("Festpreis"), claim: t("Zum Festpreis übernehmen"), reset: t("Zurücksetzen"),
    by: t("Übernommen von {name}", { name: "Alpen Taxi Innsbruck" }), hint: t("Probieren Sie es aus: Die Fahrt übernehmen."),
  };
  const registerHref = appHref ?? "/register?type=TRANSPORT_COMPANY";
  const faq: [string, string][] = FAQ.map(([q, a]) => [t(q), t(a)]);
  const fahrt = FLOWS[0].steps;
  const companies = ["Alpen Taxi Innsbruck", "Zillertal Transfer", "Kufsteiner Mietwagen"];
  const photos = [
    { src: "/landing/tirol/arlberg-gipfel.jpg", alt: t("Verschneiter Gipfel am Arlberg") },
    { src: "/landing/tirol/mayrhofen-abend.jpg", alt: t("Abendlicht über dem Zillertal bei Mayrhofen") },
    { src: "/landing/tirol/innsbruck-hofgasse.jpg", alt: t("Die Hofgasse in der Innsbrucker Altstadt") },
  ];
  return (
    <div className="hp">
      {/* Erste Seite: fast leer, alles hängt an einer Achse; unten schaut die erste Fahrtkarte herein */}
      <section className="hp-hero" aria-labelledby="hp-title">
        <header className="hp-top">
          <Link href="/" className="hp-mark" aria-label="Transferborsa"><Logo mono /></Link>
          <div className="hp-top-end">
            <LangSwitch path="/" className="hp-toplink" />
            {!appHref && <Link href="/login" className="hp-toplink">{t("Anmelden")}</Link>}
          </div>
        </header>
        <div className="hp-hero-col">
          <h1 id="hp-title">{t("Geben Sie Fahrten ab, die Sie nicht schaffen.")}</h1>
          <p>{t("Geprüfte Taxi- und Mietwagenunternehmen in Tirol übernehmen sie, zum Festpreis oder per Angebot.")}</p>
          <div className="hp-hero-act">
            <Link href={registerHref} className="hp-btn">{appHref ? t("Zur App") : t("Unternehmen registrieren")}</Link>
            <a href="#ablauf" className="hp-link">{t("So läuft eine Fahrt.")}</a>
          </div>
        </div>
        <div className="hp-peek" aria-hidden="true">
          <FlowCard t={t} c={fahrt[0][1]} />
        </div>
      </section>

      {/* Was bei einer Weitergabe zählt: vier kleine Beweise neben Text, nie im Wechsel */}
      <section className="hp-feat" aria-labelledby="hp-feat-h">
        <h2 id="hp-feat-h">{t("Was bei einer Weitergabe zählt.")}</h2>

        <div className="hp-mod">
          <div className="hp-panel"><ClaimOrder L={claim} /></div>
          <div className="hp-mod-text">
            <h3>{t("Wer frei hat, übernimmt.")}</h3>
            <p>{t("Wer frei hat, übernimmt zum Festpreis. Für alle anderen ist die Fahrt weg.")}</p>
          </div>
        </div>

        <div className="hp-mod">
          <div className="hp-panel">
            <div className="hp-card hp-list" data-ui>
              <ul>
                {companies.map((c) => <li key={c}><Check /><span>{c}</span></li>)}
              </ul>
              <p className="hp-muted">{t("Konzession, Versicherung und Firmendaten sind vorab geprüft.")}</p>
            </div>
          </div>
          <div className="hp-mod-text">
            <h3>{t("Nur geprüfte Unternehmen.")}</h3>
            <p>{t("Nur Unternehmen, die wir geprüft haben, sehen Ihre Fahrt und dürfen sie übernehmen.")}</p>
          </div>
        </div>

        <div className="hp-mod">
          <div className="hp-panel">
            <div className="hp-card hp-private" data-ui>
              <p className="hp-order-route">{t("Flughafen München")} → Kitzbühel</p>
              <p className="hp-muted">{t("6 Personen · 6 Koffer · 4 Paar Ski · Kleinbus")}</p>
              <p className="hp-mask" aria-hidden="true">●●●●●● ●●●●●●●</p>
              <span className="hp-chip hp-chip-ok">{t("Name und Nummer nach der Übernahme")}</span>
            </div>
          </div>
          <div className="hp-mod-text">
            <h3>{t("Fahrgastdaten bleiben privat")}</h3>
            <p>{t("Namen und Nummern sieht nur, wer die Fahrt übernimmt.")}</p>
          </div>
        </div>

        <div className="hp-mod">
          <div className="hp-panel hp-panel-doc"><Confirmation t={t} /></div>
          <div className="hp-mod-text">
            <h3>{t("Bestätigung als PDF")}</h3>
            <p>{t("Preis, Gepäck und Stornobedingungen stehen mit jeder Buchung schwarz auf weiß da.")}</p>
          </div>
        </div>
      </section>

      {/* Durch die Stufen ziehen */}
      <section id="ablauf" className="hp-stage" aria-labelledby="hp-ablauf">
        <h2 id="hp-ablauf" className="hp-sr">{t("So läuft eine Fahrt.")}</h2>
        <Stages
          label={t("So läuft eine Fahrt.")}
          names={[t("Abgeben"), t("Übernehmen"), t("Bestätigen"), t("Erledigt")]}
          clauses={fahrt.map(([c]) => t(c))}
          panels={fahrt.map(([, c], k) => <FlowCard key={k} t={t} c={c} />)}
        />
      </section>

      {/* Dunkle Reihe: die Börse im Vergleich zum Gruppenchat, Karte für Karte */}
      <section className="hp-show" aria-labelledby="hp-show-h">
        <h2 id="hp-show-h" className="hp-sr">{t("Aus der Gruppe wird ein Auftrag.")}</h2>
        <Showcase
          prev={t("Zurück")} next={t("Weiter")}
          items={[
            { name: t("Bisher läuft es so."), text: t("Die Fahrt geht in die Gruppe, drei Kollegen antworten halb, Preis und Gepäck bleiben mündlich."), node: <ChatScene t={t} /> },
            { name: t("Mit Transferborsa stellen Sie die Fahrt einmal ein."), text: t("Alle geprüften Kollegen sehen sie, mit Zeit, Gepäck und Festpreis."), node: <FlowCard t={t} c={fahrt[0][1]} /> },
            { name: t("Wenn der Preis noch offen ist."), text: `${t("Dann kommen Angebote.")} ${t("Dann wählen Sie.")}`, node: <FlowCard t={t} c={FLOWS[1].steps[1][1]} /> },
            { name: t("Danach steht alles schriftlich da."), text: t("Preis, Flug, Gepäck und Stornobedingungen in einer Bestätigung als PDF."), node: <Confirmation t={t} /> },
            { name: t("Wenn der Flug später landet."), text: t("Landet der Flug später, ändert der Auftraggeber die Zeit. Beide Seiten sehen denselben Stand."), node: <FlowCard t={t} c={FLOWS[2].steps[1][1]} /> },
          ]}
        />
      </section>

      {/* Strecken mit einem Bild, das sich langsam verwandelt */}
      <section id="strecken" className="hp-routes-sec" aria-labelledby="hp-strecken">
        <div className="hp-routes-col">
          <h2 id="hp-strecken">{t("Die Strecken, auf denen wir anfangen")}</h2>
          <table className="hp-routes">
            <tbody>
              {ROUTES.map(([route, time]) => (
                <tr key={route}><td>{t(route)}</td><td>{t(time)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="hp-small">{t("Salzburg, Zürich und Südtirol folgen, sobald dort regelmäßig Fahrten vermittelt werden.")}</p>
        </div>
        <figure className="hp-routes-pic">
          <Crossfade images={photos} w={1200} h={1500} />
          <figcaption>{t("Fotos: Erich Fend, Linas Bam, Leonhard Lenz (Unsplash, alle CC0)")}</figcaption>
        </figure>
      </section>

      {/* Ein Preis, sehr groß */}
      <section className="hp-price" aria-labelledby="hp-preis">
        <div className="hp-price-text">
          <h2 id="hp-preis">{t("Ein Preis für alle Fahrten.")}</h2>
          <p>{t("Fester Monatspreis per Rechnung für Taxi- und Transferunternehmen. Für Reisebüros und Hotels ist die Nutzung kostenlos.")}</p>
        </div>
        <div className="hp-price-fig">
          <p className="hp-price-num" aria-label={`${t("Ab")} ${figure} € ${t("im Monat.")}`}>
            <span className="hp-price-from">{t("Ab")}</span>
            <span aria-hidden="true">{figure}<small>€</small></span>
            <span className="hp-price-per">{t("im Monat.")}</span>
          </p>
          <div className="hp-card hp-tag" data-ui>
            <span className="hp-chip hp-chip-ok">{t("Ohne Provision.")}</span>
            <p>{t("Pro Fahrt fällt nichts an.")}</p>
          </div>
          <ul className="hp-price-incl">
            {plan.features.slice(0, 4).map((f) => <li key={f}>{t(f)}</li>)}
          </ul>
          <div className="hp-price-act">
            <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn">{t("Unternehmen registrieren")}</Link>
            <Link href="/preise" className="hp-link">{t("Preise")}</Link>
          </div>
        </div>
      </section>

      {/* Fragen: eine Antwort groß, die Fragen als Verzeichnis */}
      <section id="fragen" className="hp-faq" aria-labelledby="hp-fragen">
        <FaqIndex heading={t("Häufige Fragen")} items={faq} />
      </section>

      {/* Schluss: der erste Schritt der App ist schon offen */}
      <section className="hp-ask" aria-labelledby="hp-wer">
        <div className="hp-ask-text">
          <h2 id="hp-wer"><span>{t("Taxi oder")}</span><span>{t("Reisebüro?")}</span></h2>
          <p>{t("Wir sind im Pilotbetrieb rund um Innsbruck und melden uns persönlich.")}</p>
        </div>
        <Start
          L={{
            title: t("Wer sind Sie?"),
            taxi: t("Taxi- oder Mietwagenunternehmen"),
            travel: t("Reisebüro oder Hotel"),
            taxiNote: t("Fester Monatspreis, keine Provision pro Fahrt."),
            travelNote: t("Für Reisebüros und Hotels kostenlos."),
            go: t("Registrieren"),
          }}
        />
      </section>

      <footer className="hp-foot">
        <p>{t("Die Börse für Taxi- und Transferunternehmen in Tirol.")}</p>
        <nav aria-label={t("Rechtliches")}>
          <Link href="/preise">{t("Preise")}</Link>
          <Link href="/impressum">{t("Impressum")}</Link>
          <Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link>
          <a href="mailto:transferborsatirol@gmail.com?subject=Transferborsa">{t("Kontakt")}</a>
        </nav>
        <p className="hp-foot-end">2026 · <Link href="/datenschutz">{t("Datenschutz")}</Link></p>
      </footer>
    </div>
  );
}
