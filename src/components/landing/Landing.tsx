import { Logo } from "../Logo";
import Link from "next/link";
import type { ReactNode } from "react";
import "@fontsource-variable/albert-sans";
import "./home.css";
import { LangSwitch } from "../LangSwitch";
import { getI18n } from "@/server/i18n";
import { formatCents } from "@/lib/money";
import { PLANS } from "@/lib/plans";

// Startseite im Stil eines Produkt-Onepagers (Vorbild: caporide.com): weiß, eine Schrift, echte Oberfläche statt Dekor.
// Jeder Abschnitt zeigt ein Stück der App oder einen Alltagsmoment und beantwortet eine Frage, die ein
// Taxiunternehmer wirklich hat: Was ist das, warum nicht WhatsApp, wem kann ich trauen, was kostet es.
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

/* ---------- Icons: eine Strichstärke, 20 px ---------- */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="hp-ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
const IcShield = () => <Icon><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></Icon>;
const IcPin = () => <Icon><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Icon>;
const IcEuro = () => <Icon><path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h9M4 14h9" /></Icon>;
const IcGlobe = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></Icon>;
const IcCheck = () => <svg className="hp-tick" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

type T = (key: string, vars?: Record<string, string | number>) => string;

/* ---------- Oberflächen als HTML, nicht als Bild: bleiben scharf und übersetzbar ---------- */

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
    <figure className="hp-chat" aria-label={t("Beispiel: Fahrt in der Gruppe suchen")}>
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

/** Der Auftrag, wie die Börse ihn zeigt. */
function OrderCard({ t, actions = false }: { t: T; actions?: boolean }) {
  return (
    <div className="hp-card hp-order">
      <div className="hp-order-top">
        <span className="hp-chip hp-chip-open">{t("Offen")}</span>
        <span className="hp-muted">{t("Sa 15.11.")} · {t("11:00 Uhr")}</span>
      </div>
      <p className="hp-order-route">{t("Flughafen München")} → Kitzbühel</p>
      <p className="hp-muted">{t("6 Personen · 6 Koffer · 4 Paar Ski · Kleinbus")}</p>
      <div className="hp-order-price"><b>310 €</b><span>{t("Festpreis")}</span></div>
      {actions && (
        <div className="hp-order-actions">
          <span className="hp-fake hp-fake-primary">{t("Zum Festpreis übernehmen")}</span>
          <span className="hp-fake">{t("Angebot abgeben")}</span>
        </div>
      )}
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
    <div className="hp-card hp-companies" aria-label={t("Beispiel: geprüfte Unternehmen")}>
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
    <div className="hp-paper" aria-label={t("Beispiel: Bestätigung als PDF")}>
      <p className="hp-paper-head"><b>{t("Buchungsbestätigung")}</b><span>TB-2411-0187</span></p>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}><dt>{t(k)}</dt><dd>{t(v)}</dd></div>
        ))}
      </dl>
    </div>
  );
}

/** Abschnitt aus Text und Oberfläche; `flip` dreht die Seiten. */
function Feature({ id, flip, title, text, points, children }: { id?: string; flip?: boolean; title: string; text: string; points: [string, string][]; children: ReactNode }) {
  return (
    <section id={id} className="hp-section">
      <div className={`hp-wrap hp-feature${flip ? " hp-flip" : ""}`}>
        <div className="hp-feature-text">
          <h2>{title}</h2>
          <p className="hp-lead">{text}</p>
          <ul className="hp-points">
            {points.map(([h, p]) => (
              <li key={h}><b>{h}</b><span>{p}</span></li>
            ))}
          </ul>
        </div>
        <div className="hp-feature-shot">{children}</div>
      </div>
    </section>
  );
}

export async function Landing({ appHref }: { appHref?: string } = {}) {
  const { t, locale } = await getI18n();
  const shot = (name: string) => `/landing/app/${name}-${locale === "en" ? "en" : "de"}.webp`;
  return (
    <div className="hp">
      <header className="hp-head">
        <div className="hp-wrap hp-top">
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
              ? <Link href={appHref} className="hp-btn hp-btn-dark">{t("Zur App")}</Link>
              : <><Link href="/login" className="hp-hide-s">{t("Anmelden")}</Link><Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn hp-btn-dark">{t("Registrieren")}</Link></>}
          </div>
        </div>
      </header>

      <main>
        <section className="hp-hero" aria-labelledby="hp-title">
          <div className="hp-wrap">
            <h1 id="hp-title">{t("Das Transfernetzwerk für Taxi- und Mietwagenunternehmen.")}</h1>
            <ul className="hp-checks hp-hero-checks">
              <li><IcCheck />{t("Treten Sie einem Netzwerk geprüfter Unternehmen bei.")}</li>
              <li><IcCheck />{t("Stellen Sie Fahrten ein oder übernehmen Sie offene Aufträge.")}</li>
              <li><IcCheck />{t("Preis, Flug und Gepäck stehen in der Bestätigung (PDF)")}</li>
            </ul>

            <div className="hp-actions">
              <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn">{t("Unternehmen registrieren")}</Link>
              <Link href="/register?type=TRAVEL_AGENCY" className="hp-link">{t("Reisebüro oder Hotel? Kostenlos registrieren")}</Link>
            </div>
            <p className="hp-note">{t("Wir sind im Pilotbetrieb rund um Innsbruck und melden uns persönlich.")}</p>
          </div>

          <div className="hp-wrap hp-hero-shots">
            <picture className="hp-browser">
              <img src={shot("boerse")} width={1600} height={1000} alt={t("Die Auftragsbörse mit offenen Fahrten, Filtern und Preisen")} decoding="async" />
            </picture>
            <picture className="hp-phone">
              <img src={shot("boerse-handy")} width={700} height={1515} alt={t("Die Auftragsbörse auf dem Handy")} loading="lazy" decoding="async" />
            </picture>
          </div>
          <p className="hp-wrap hp-note hp-shot-note">{t("Die Börse mit Beispieldaten.")}</p>
        </section>

        <div className="hp-trust">
          <ul className="hp-wrap">
            <li><IcPin />{t("Entwickelt in Tirol")}</li>
            <li><IcShield />{t("Konzession und Versicherung geprüft")}</li>
            <li><IcEuro />{t("Keine Provision pro Fahrt")}</li>
            <li><IcGlobe />{t("Deutsch und Englisch")}</li>
          </ul>
        </div>

        <section id="ablauf" className="hp-section" aria-labelledby="hp-wa">
          <div className="hp-wrap hp-feature">
            <div className="hp-feature-text">
              <h2 id="hp-wa">{t("Aus der Gruppe wird ein Auftrag.")}</h2>
              <p className="hp-lead">{t("Samstag, Hauptanreise, alle Busse sind unterwegs. Statt fünf Kollegen anzurufen, stellen Sie die Fahrt hier ein.")} <strong>{t("Wer frei hat, übernimmt.")}</strong></p>
              <ul className="hp-checks">
                {AFTER.map((s) => <li key={s}><IcCheck />{t(s)}</li>)}
              </ul>
            </div>
            <div className="hp-feature-shot hp-duo">
              <ChatScene t={t} />
              <OrderCard t={t} />
            </div>
          </div>
        </section>

        <Feature
          title={t("Festpreis oder Angebot.")}
          text={t("Wer die Fahrt einstellt, legt fest, wie sie vergeben wird. Beim Festpreis übernimmt das erste geprüfte Unternehmen direkt und verbindlich.")}
          points={[
            [t("Festpreis"), t("Ein Klick, die Fahrt ist vergeben.")],
            [t("Angebot"), t("Unternehmen nennen ihren Preis, Sie wählen.")],
          ]}
        >
          <OrderCard t={t} actions />
        </Feature>

        <Feature
          flip
          title={t("Nur geprüfte Unternehmen.")}
          text={t("Wir prüfen Konzession, Versicherung und Firmendaten, bevor ein Unternehmen Fahrten übernehmen darf.")}
          points={[
            [t("Geprüft je Geschäftsfunktion"), t("Wer nur Fahrzeuge anbietet, wird anders geprüft als wer Aufträge übernimmt.")],
            [t("Keine Namen für Fremde"), t("Andere Teilnehmer sehen Strecke, Zeit, Personenzahl und Gepäck, aber keine Fahrgastdaten.")],
          ]}
        >
          <CompanyList t={t} />
        </Feature>

        <Feature
          title={t("Alles Schriftliche in einer Bestätigung.")}
          text={t("Preis und Gepäck mündlich auszumachen, führt zu Streit. Hier stehen sie mit jeder Buchung in einem PDF.")}
          points={[
            [t("Mit Flugdaten"), t("Abholzeit und Landung stehen im selben Dokument.")],
            [t("Mit Stornobedingungen"), t("Beide Seiten sehen denselben Stand.")],
          ]}
        >
          <Confirmation t={t} />
        </Feature>

        <section className="hp-section hp-tint" aria-labelledby="hp-wer">
          <div className="hp-wrap">
            <h2 id="hp-wer">{t("Für beide Seiten der Fahrt.")}</h2>
            <div className="hp-who">
              <div>
                <h3>{t("Taxi- und Transferunternehmen")}</h3>
                <p>{t("Fahrten weitergeben, die Sie nicht schaffen. Aufträge übernehmen, wenn Wagen frei sind. Leerfahrten füllen.")}</p>
                <p className="hp-muted">{t("Fester Monatspreis, keine Provision pro Fahrt.")}</p>
              </div>
              <div>
                <h3>{t("Reisebüros und Hotels")}</h3>
                <p>{t("Transfers für Ihre Gäste einstellen und sehen, wer sie übernimmt. Mit Bestätigung für jede Buchung.")}</p>
                <p className="hp-muted">{t("Kostenlos.")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="hp-section" aria-labelledby="hp-schritte">
          <div className="hp-wrap">
            <h2 id="hp-schritte">{t("In drei Schritten dabei.")}</h2>
            <ol className="hp-steps">
              <li><b>{t("Registrieren")}</b><span>{t("Firmendaten angeben, kostenlos im Pilotbetrieb.")}</span></li>
              <li><b>{t("Unternehmensprüfung")}</b><span>{t("Wir prüfen Konzession, Versicherung und Firmendaten.")}</span></li>
              <li><b>{t("Zugang zur Börse")}</b><span>{t("Fahrten einstellen, übernehmen und bestätigen.")}</span></li>
            </ol>
            <div className="hp-actions">
              <Link href="/register?type=TRANSPORT_COMPANY" className="hp-btn">{t("Unternehmen registrieren")}</Link>
            </div>
          </div>
        </section>

        <section id="strecken" className="hp-section" aria-labelledby="hp-strecken">
          <div className="hp-wrap hp-two">
            <h2 id="hp-strecken">{t("Die Strecken, auf denen wir anfangen")}</h2>
            <div>
              <table className="hp-routes">
                <tbody>
                  {ROUTES.map(([route, time]) => (
                    <tr key={route}><td>{t(route)}</td><td>{t(time)}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="hp-note">{t("Salzburg, Zürich und Südtirol folgen, sobald dort regelmäßig Fahrten vermittelt werden.")}</p>
            </div>
          </div>
        </section>

        <section className="hp-section hp-tint" aria-labelledby="hp-preis">
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

        <section id="fragen" className="hp-section" aria-labelledby="hp-fragen">
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

        <section className="hp-cta" aria-labelledby="hp-kontakt">
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
