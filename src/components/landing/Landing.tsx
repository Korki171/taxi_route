import { Logo } from "../Logo";
import Link from "next/link";
import "@fontsource-variable/imbue";
import "@fontsource-variable/albert-sans";
import "./home.css";
import { LangSwitch } from "../LangSwitch";
import { getI18n } from "@/server/i18n";
import { formatCents } from "@/lib/money";
import { PLANS } from "@/lib/plans";

// Startseite (Redesign 2026-11-09, impeccable + taste-skill + emil-design-eng): flach, eckig, ohne Dekor.
// Der eine bewegte Moment ist inhaltlich: der Auftrag wechselt von „Offen“ auf „Vergeben“.
// Davor Richtung „Echte Fahrt“ (2026-11-09): eine konkrete Fahrt statt Werbesprache,
// ruhiges Layout ohne Effekte, ein echter Screenshot der Börse. Jeder Abschnitt beantwortet eine Frage,
// die ein Taxiunternehmer wirklich hat: Was ist das, warum nicht WhatsApp, wo, wie sieht es aus, was kostet es.

/** Strecken mit ungefährer Fahrzeit ab Flughafen München (Werte wie in der App). */
const ROUTES: [string, string][] = [
  ["Flughafen München → Innsbruck", "ca. 1 h 50 min"],
  ["Flughafen München → Kitzbühel", "ca. 1 h 40 min"],
  ["Flughafen München → Mayrhofen", "ca. 2 h"],
  ["Flughafen München → Sölden", "ca. 2 h 30 min"],
  ["Innsbruck → Seefeld, Hall, Kufstein, St. Anton", "regional"],
];

const BEFORE = [
  "Fahrt in drei Gruppen posten, dann telefonieren",
  "Wer hat zugesagt? Steht irgendwo im Chat",
  "Preis und Gepäck mündlich, nichts schriftlich",
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

export async function Landing({ appHref }: { appHref?: string } = {}) {
  const { t, locale } = await getI18n();
  const shot = (name: string) => `/landing/app/${name}-${locale === "en" ? "en" : "de"}.webp`;
  return (
    <div className="hp">
      <header className="hp-dark">
        <div className="hp-wrap hp-top">
          <Link href="/" className="hp-logo" aria-label="Transferborsa"><Logo /></Link>
          <nav aria-label={t("Abschnitte")}>
            <Link href="/preise" className="hp-hide-s">{t("Preise")}</Link>
            <LangSwitch path="/" className="hp-lang" />
            {appHref ? <Link href={appHref}>{t("Zur App")}</Link> : <Link href="/login">{t("Anmelden")}</Link>}
          </nav>
        </div>
      </header>

      <main>
        <section className="hp-dark hp-hero" aria-labelledby="hp-title">
          <div className="hp-wrap">
            <h1 id="hp-title">
              <span>{t("Abgeben.")}</span>{" "}
              <span>{t("Übernehmen.")}</span>
            </h1>

            <figure className="hp-order">
              <p className="hp-order-when">{t("Sa 15.11.")} <span>{t("11:00 Uhr")}</span></p>
              <div>
                <p className="hp-order-route">{t("Flughafen München")} → Kitzbühel</p>
                <p className="hp-order-load">{t("6 Personen · 6 Koffer · 4 Paar Ski · Kleinbus")}</p>
              </div>
              <p className="hp-order-price">
                310 €<span>{t("Festpreis")}</span>
                <b className="hp-status"><i>{t("Offen")}</i><i aria-hidden="true">{t("Vergeben")}</i></b>
              </p>
              <figcaption className="hp-sr">{t("Beispiel eines Auftrags in der Börse")}</figcaption>
            </figure>

            <p className="hp-story">
              {t("Samstag, Hauptanreise, alle Busse sind unterwegs. Statt fünf Kollegen anzurufen, stellen Sie die Fahrt hier ein.")}{" "}
              <strong>{t("Wer frei hat, übernimmt.")}</strong>
            </p>

            <div className="hp-actions">
              <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn">{t("Unternehmen registrieren")}</Link>
              <Link href="/register?type=TRAVEL_AGENCY" className="hp-link">{t("Reisebüro oder Hotel? Kostenlos registrieren")}</Link>
            </div>
          </div>
        </section>

        <section className="hp-section" aria-labelledby="hp-wa">
          <div className="hp-wrap">
            <h2 id="hp-wa">{t("Statt WhatsApp-Gruppe")}</h2>
            <div className="hp-cmp">
              <div>
                <h3>{t("Bisher")}</h3>
                <ul>{BEFORE.map((s) => <li key={s}>{t(s)}</li>)}</ul>
              </div>
              <div>
                <h3>{t("Mit Transferborsa")}</h3>
                <ul>{AFTER.map((s) => <li key={s}>{t(s)}</li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        <section className="hp-section hp-stone" aria-labelledby="hp-strecken">
          <div className="hp-wrap">
            <h2 id="hp-strecken">{t("Die Strecken, auf denen wir anfangen")}</h2>
            <table className="hp-routes">
              <tbody>
                {ROUTES.map(([route, time]) => (
                  <tr key={route}><td>{t(route)}</td><td>{t(time)}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="hp-note">{t("Salzburg, Zürich und Südtirol folgen, sobald dort regelmäßig Fahrten vermittelt werden.")}</p>
          </div>
        </section>

        <section className="hp-section" aria-labelledby="hp-app">
          <div className="hp-wrap">
            <h2 id="hp-app">{t("So sieht das in der App aus")}</h2>
            <p className="hp-intro">{t("Offene Fahrten geprüfter Unternehmen. Zum Festpreis übernehmen oder ein Angebot abgeben.")}</p>
            <picture className="hp-shot">
              <source media="(max-width: 640px)" srcSet={shot("boerse-handy")} width={700} height={1515} />
              <img src={shot("boerse")} width={1600} height={1000} alt={t("Die Auftragsbörse mit offenen Fahrten, Filtern und Preisen")} loading="lazy" decoding="async" />
            </picture>
            <p className="hp-note">{t("Die Börse mit Beispieldaten.")}</p>
          </div>
        </section>

        <section className="hp-section hp-stone" aria-labelledby="hp-preis">
          <div className="hp-wrap hp-two">
            <h2 id="hp-preis">{t("Was es kostet")}</h2>
            <div>
              <p className="hp-price">
                {t("Ab {price} im Monat für Taxiunternehmen, ohne Provision pro Fahrt. Für Reisebüros und Hotels kostenlos.", { price: formatCents(PLANS[0].priceCents, locale) })}
              </p>
              <Link href="/preise" className="hp-link">{t("Alle Tarife ansehen")}</Link>
            </div>
          </div>
        </section>

        <section className="hp-section" aria-labelledby="hp-fragen">
          <div className="hp-wrap hp-two">
            <h2 id="hp-fragen">{t("Häufige Fragen")}</h2>
            <div className="hp-faq">
              {FAQ.map(([q, a]) => (
                <details key={q} name="hp-faq">
                  <summary>{t(q)}</summary>
                  <p>{t(a)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-section hp-dark" aria-labelledby="hp-kontakt">
          <div className="hp-wrap hp-two">
            <h2 id="hp-kontakt">{t("Fragen? Schreiben Sie uns.")}</h2>
            <div>
              <p className="hp-contact-text">{t("Wir sind im Pilotbetrieb rund um Innsbruck und melden uns persönlich.")}</p>
              <a className="hp-contact" href="mailto:transferborsatirol@gmail.com?subject=Transferborsa">transferborsatirol@gmail.com</a>
              <div className="hp-actions">
                <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn">{t("Unternehmen registrieren")}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="hp-footer">
        <div className="hp-wrap">
          <ul>
            <li>Transferborsa · Innsbruck</li>
            <li><Link href="/preise">{t("Preise")}</Link></li>
            <li><Link href="/impressum">{t("Impressum")}</Link></li>
            <li><Link href="/datenschutz">{t("Datenschutz")}</Link></li>
            <li><Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
