import Link from "next/link";
import "@fontsource-variable/imbue";
import "@fontsource-variable/albert-sans";
import "./landing.css";
import { Motion } from "./Motion";
import { RouteDemo } from "./RouteDemo";

const PLACES = ["Innsbruck", "Hall", "Schwaz", "Kufstein", "Kitzbühel", "Seefeld", "Mayrhofen", "Sölden", "St. Anton"];

const RIGHTS: { group: string; rows: [string, string, string][] }[] = [
  {
    group: "Taxiunternehmen",
    rows: [
      ["Taxiunternehmen", "Aufträge einstellen und übernehmen", "nach Prüfung"],
      ["Taxiunternehmen", "Freie Rückfahrten anbieten", "nach Prüfung"],
      ["Taxiunternehmen", "Festpreis oder eigenes Angebot", "frei wählbar"],
    ],
  },
  {
    group: "Reisebüros",
    rows: [
      ["Reisebüro", "Transfers für Kunden anfragen", "nach Freischaltung"],
      ["Reisebüro", "Angebote vergleichen und buchen", "nach Freischaltung"],
      ["Reisebüro", "Fahrzeuge anbieten", "nur mit Konzession"],
    ],
  },
  {
    group: "Beide",
    rows: [
      ["Beide", "Fahrgastdaten sehen", "nur eigene Buchungen"],
      ["Beide", "Mitarbeiter mit eigenen Rollen", "Inhaber bis Lesezugriff"],
    ],
  },
];

const STAGES = [
  { grow: 1, colour: "a", time: "Zwei Minuten", text: "Zuerst beschreibt der Auftraggeber die Fahrt: Abholung, Flug, Gepäck, Ski." },
  { grow: 6, colour: "b", time: "Bis zur Angebotsfrist", text: "Dann geben geprüfte Unternehmen Festpreise oder eigene Angebote ab." },
  { grow: 1, colour: "c", time: "Ein Klick", text: "Danach wird ein Angebot angenommen. Ab hier ist der Preis verbindlich." },
  { grow: 3, colour: "d", time: "Rund 1 h 50 min", text: "Zuletzt fährt das Unternehmen, und der Abschluss wird dokumentiert." },
];

const FAQ: [string, string][] = [
  [
    "Ist eine Anfrage schon eine Buchung?",
    "Nein. TaxiRoute trennt drei Zustände: die Anfrage mit einem unverbindlichen Richtpreis, das abgegebene Angebot und die bestätigte Buchung mit dem endgültigen Preis. Erst die Bestätigung ist verbindlich, und jeder Schritt ist für beide Seiten sichtbar.",
  ],
  [
    "Wer prüft die Unternehmen?",
    "Wir prüfen Konzession, Versicherung und Firmendaten, bevor ein Unternehmen Aufträge übernehmen oder Fahrzeuge anbieten darf. Geprüft wird je Geschäftsfunktion. Grenzüberschreitende Strecken werden gesondert betrachtet.",
  ],
  [
    "Kann ein Reisebüro selbst Fahrten anbieten?",
    "Nur wenn es zusätzlich eine eigene Konzession nachweist und diese Funktion von uns freigegeben wurde. Ohne diese Prüfung fragt ein Reisebüro Transfers an und bucht sie, bietet aber keine Kapazität an.",
  ],
  [
    "Wer sieht die Daten meiner Fahrgäste?",
    "Nur der Auftraggeber und das Unternehmen, das die bestätigte Fahrt durchführt. Andere Teilnehmer der Börse sehen Strecke, Zeit, Personenzahl und Gepäck, aber keine Namen oder Telefonnummern.",
  ],
  [
    "Wie wird bezahlt?",
    "Im Pilotbetrieb wickelt TaxiRoute keine Zahlungen ab. Vereinbarter Preis, Gebühr und Rechnungsreferenz werden mit der Buchung gespeichert, abgerechnet wird direkt zwischen den beteiligten Unternehmen.",
  ],
  [
    "Was gilt bei Storno oder Verspätung?",
    "Die vereinbarten Stornobedingungen werden mit jeder Buchung festgehalten. Änderungen, Verspätungen und Rückfragen laufen über den Auftrag selbst, damit beide Seiten denselben Stand sehen.",
  ],
];

export function Landing() {
  return (
    <div className="lp">
      <Motion />
      <header className="lp-header" data-ink="paper">
        <Link href="/" className="lp-wordmark">TaxiRoute</Link>
        <nav aria-label="Hauptnavigation">
          <a href="#boerse">Börse</a>
          <a href="#ablauf">Ablauf</a>
          <a href="#preise">Preise</a>
          <Link href="/login">Anmelden</Link>
        </nav>
        <Link href="/register" className="lp-btn lp-btn-accent">Registrieren</Link>
      </header>

      <main>
        <section className="lp-hero" data-ink="paper" aria-labelledby="lp-title">
          <h1 id="lp-title" className="lp-hero-title">
            <span className="lp-hero-copy lp-hero-top">Hin voll.</span>{" "}
            <span className="lp-hero-copy lp-hero-bottom">Retour voll.</span>
          </h1>
          <div className="lp-hero-low" data-ink="navy">
            <p className="lp-hero-lead">
              TaxiRoute ist die Auftragsbörse für Taxiunternehmen und Reisebüros in Tirol: Transfers zum Flughafen München
              vergeben, Angebote vergleichen und leere Rückfahrten füllen.
            </p>
          </div>
        </section>

        <section id="boerse" className="lp-chapter lp-showcase" data-ink="paper" aria-labelledby="lp-boerse">
          <h2 id="lp-boerse" className="lp-sr">Die Börse ausprobieren</h2>
          <div data-reveal>
            <RouteDemo />
          </div>
        </section>

        <section id="ablauf" className="lp-chapter lp-stages-wrap" data-ink="stone" aria-labelledby="lp-ablauf">
          <h2 id="lp-ablauf" className="lp-h2" data-reveal>Von der Anfrage zur Fahrt</h2>
          <ol className="lp-stages" data-ui data-reveal>
            {STAGES.map((s) => (
              <li key={s.time} style={{ flexGrow: s.grow }} className={`lp-stage lp-stage-${s.colour}`}>
                <span className="lp-stage-bar"><span className="lp-stage-time">{s.time}</span></span>
                <span className="lp-stage-text">{s.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="lp-chapter lp-rights" data-ink="paper" aria-labelledby="lp-rechte">
          <h2 id="lp-rechte" className="lp-h2 lp-indent" data-reveal>Jeder sieht nur, was er braucht</h2>
          <div className="lp-rights-grid">
            <figure className="lp-confirm" data-ui data-reveal>
              <p className="lp-confirm-head">Buchungsbestätigung</p>
              <p className="lp-confirm-ref">TR-2611-0415</p>
              <dl>
                <dt>Auftraggeber</dt><dd>Reisebüro aus Kitzbühel</dd>
                <dt>Ausführend</dt><dd>Taxiunternehmen aus Schwaz</dd>
                <dt>Strecke</dt><dd>Flughafen München → Innsbruck</dd>
                <dt>Abholung</dt><dd>Fr 14.11., 09:15 Uhr</dd>
                <dt>Leistung</dt><dd>Limousine, 2 Pers., 2 Koffer</dd>
                <dt>Storno</dt><dd>kostenfrei bis 24 h vorher</dd>
                <dt>Angenommen</dt><dd>12.11., 16:02 Uhr</dd>
              </dl>
              <p className="lp-confirm-price"><span>Bestätigter Preis</span><strong>205 €</strong></p>
              <figcaption className="lp-sr">Beispiel einer Buchungsbestätigung</figcaption>
            </figure>
            <div className="lp-table" data-reveal>
              <p className="lp-table-name">Rechte</p>
              {RIGHTS.map((g) => (
                <ul key={g.group} className="lp-table-group">
                  {g.rows.map(([kind, what, value]) => (
                    <li key={what}>
                      <span className="lp-t-kind">{kind}</span>
                      <span className="lp-t-what">{what}</span>
                      <span className="lp-t-value">{value}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-chapter lp-places-wrap" data-ink="navy" aria-labelledby="lp-strecken">
          <div className="lp-places" data-reveal>
            <h2 id="lp-strecken">Wir starten auf diesen Strecken:</h2>{" "}
            <p>
              {PLACES.map((p, i) => (
                <span key={p}>
                  <b className={i === 0 ? "is-lit" : undefined}>{p}</b>
                  {i < PLACES.length - 2 ? ", " : i === PLACES.length - 2 ? " und " : ""}
                </span>
              ))}
              .
            </p>
          </div>
          <p className="lp-places-more" data-reveal>
            Jeweils von und zum Flughafen München. Salzburg, Zürich, Südtirol und Norditalien folgen, sobald auf diesen
            Strecken regelmäßig vermittelt wird.
          </p>
        </section>

        <section id="preise" className="lp-chapter lp-price" data-ink="stone" aria-labelledby="lp-preis">
          <h2 id="lp-preis" className="lp-price-line" data-reveal>
            Im Pilot <span className="lp-price-block">0 €</span>
            <br />pro Vermittlung.
          </h2>
          <div className="lp-price-foot" data-reveal>
            <p>
              Registrierung, Börse und Buchungen sind während des Pilotbetriebs in Tirol kostenlos. Gebühren führen wir erst
              ein, wenn regelmäßig Fahrten vermittelt werden, und kündigen sie vorher an.
            </p>
            <div className="lp-price-actions">
              <Link href="/register" className="lp-btn lp-btn-accent">Unternehmen registrieren</Link>
              <Link href="/login" className="lp-textlink">Bereits registriert? Anmelden</Link>
            </div>
          </div>
        </section>

        <section id="fragen" className="lp-chapter lp-faq" data-ink="paper" aria-labelledby="lp-fragen">
          <h2 id="lp-fragen" className="lp-h2" data-reveal>Was Sie wissen sollten</h2>
          <div className="lp-faq-list" data-reveal>
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-cta" data-ink="night" aria-labelledby="lp-wer">
          <h2 id="lp-wer" className="lp-cta-q">
            <span>Taxi</span>
            <span>oder Reisebüro?</span>
          </h2>
          <div className="lp-cta-mid">
            <div className="lp-cta-row">
              <Link href="/register?type=TRANSPORT_COMPANY" className="lp-btn lp-btn-accent">Als Taxiunternehmen</Link>
              <span className="lp-cta-or">oder</span>
              <Link href="/register?type=TRAVEL_AGENCY" className="lp-btn lp-btn-paper">Als Reisebüro</Link>
            </div>
            <p>Beide Wege führen zur kostenlosen Registrierung. Danach prüfen wir Ihr Unternehmen und schalten die passenden Funktionen frei.</p>
          </div>
        </section>
      </main>

      <footer className="lp-footer" data-ink="navy">
        <div className="lp-footer-top">
          <p><strong>TaxiRoute</strong>, die Auftragsbörse für Personenbeförderung in Tirol und Bayern.</p>
          <p>Pilotbetrieb ab Innsbruck.</p>
          <a href="#lp-title" className="lp-textlink">Nach oben</a>
        </div>
        <h2 className="lp-sr">Kontakt</h2>
        <a className="lp-contact" href="mailto:hallo@taxiroute.at?subject=TaxiRoute%20Pilotbetrieb">
          hallo<wbr />@taxiroute.at
        </a>
        <div className="lp-footer-meta">
          <span><Link href="/login">Anmelden</Link> · <Link href="/register">Registrieren</Link></span>
          <span>Schriften: Imbue und Albert Sans, SIL Open Font License</span>
          <span>Innsbruck 2026</span>
        </div>
      </footer>
    </div>
  );
}
