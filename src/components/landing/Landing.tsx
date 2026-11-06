import { Logo } from "../Logo";
import Link from "next/link";
import "@fontsource-variable/imbue";
import "@fontsource-variable/albert-sans";
import "./landing.css";
import { Motion } from "./Motion";
import { RouteDemo } from "./RouteDemo";
import { LangSwitch } from "../LangSwitch";
import { getI18n } from "@/server/i18n";
import { formatCents } from "@/lib/money";
import { PLANS } from "@/lib/plans";

// Das Motiv der Seite ist der Wendepunkt am Flughafen: ein Viertelkreis. Er sitzt als Ecke an Bildern,
// Kacheln und Mappen, als Rundung der Knöpfe und als Kerbe in Bordkarte und Ticket.

/** Strecken als Abflugtafel: Zeile, Vorschaubild. Jedes Bild zeigt den Ort, nie das Unternehmen. */
const ROUTES: { name: string; image: string; alt: string; w: number; h: number }[] = [
  { name: "Flughafen München", image: "flughafen", alt: "Check-in-Halle am Flughafen München, ein Fahrgast trägt einen Skisack", w: 1600, h: 975 },
  { name: "Innsbruck", image: "innsbruck", alt: "Innsbruck mit den roten Dächern der Stadt, dahinter die verschneite Nordkette", w: 1280, h: 720 },
  { name: "Hall", image: "hall", alt: "Blick über Hall in Tirol mit Stiftskirche, dahinter das Karwendel", w: 1600, h: 1200 },
  { name: "Kufstein", image: "kufstein", alt: "Die beleuchtete Festung Kufstein bei Nacht", w: 1600, h: 1185 },
  { name: "Kitzbühel", image: "kitzbuehel", alt: "Die Vorderstadt von Kitzbühel im Schnee, hinter den bunten Giebeln die Kirche", w: 1600, h: 1067 },
  { name: "Seefeld", image: "seefeld", alt: "Seefeld in Tirol von oben, dahinter das Karwendel", w: 1600, h: 533 },
];
const MORE_PLACES = "Schwaz, Mayrhofen, Sölden, St. Anton";
const MORE_ALT = "Grüne Almberge in den Tiroler Alpen, die Gipfel in Wolken";

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

/** Die vier Stationen einer Fahrt, von dunkel nach hell. Das Bild zeigt die Welt der Station. */
const STAGES: { tone: string; time: string; text: string; image: string; alt: string; w: number; h: number }[] = [
  { tone: "a", time: "Zwei Minuten", text: "Zuerst beschreibt der Auftraggeber die Fahrt: Abholung, Flug, Gepäck, Ski.", image: "flughafen", alt: "Check-in-Halle am Flughafen München, ein Fahrgast trägt einen Skisack", w: 1600, h: 975 },
  { tone: "b", time: "Bis zur Angebotsfrist", text: "Dann geben geprüfte Unternehmen Festpreise oder eigene Angebote ab.", image: "hall", alt: "Blick über Hall in Tirol mit Stiftskirche, dahinter das Karwendel", w: 1600, h: 1200 },
  { tone: "c", time: "Ein Klick", text: "Danach wird ein Angebot angenommen. Ab hier ist der Preis verbindlich.", image: "kufstein", alt: "Die beleuchtete Festung Kufstein bei Nacht", w: 1600, h: 1185 },
  { tone: "d", time: "Rund 1 h 50 min", text: "Zuletzt fährt das Unternehmen, und der Abschluss wird dokumentiert.", image: "innsbruck", alt: "Innsbruck mit den roten Dächern der Stadt, dahinter die verschneite Nordkette", w: 1280, h: 720 },
];

const FAQ: [string, string][] = [
  [
    "Ist eine Anfrage schon eine Buchung?",
    "Nein. Transferborsa trennt drei Zustände: die Anfrage mit einem unverbindlichen Richtpreis, das abgegebene Angebot und die bestätigte Buchung mit dem endgültigen Preis. Erst die Bestätigung ist verbindlich, und jeder Schritt ist für beide Seiten sichtbar.",
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
    "Fahrpreise rechnen die beteiligten Unternehmen direkt miteinander ab; vereinbarter Preis und Rechnungsreferenz werden mit der Buchung gespeichert. Taxiunternehmen zahlen für Transferborsa einen festen Monatspreis per Rechnung, ohne Provision pro Fahrt. Für Reisebüros und Hotels ist die Nutzung kostenlos.",
  ],
  [
    "Was gilt bei Storno oder Verspätung?",
    "Die vereinbarten Stornobedingungen werden mit jeder Buchung festgehalten. Änderungen, Verspätungen und Rückfragen laufen über den Auftrag selbst, damit beide Seiten denselben Stand sehen.",
  ],
];

/** Die Marke im Fuß, Buchstabe für Buchstabe aus eigenen Blöcken: Höhe in Prozent, Farbe aus der Palette. */
const MARK: [string, number, string][] = [
  ["T", 82, "accent"], ["R", 100, "paper"], ["A", 68, "sky"], ["N", 92, "stone"], ["S", 76, "accent"],
  ["F", 100, "paper"], ["E", 64, "sky"], ["R", 88, "stone"], ["B", 100, "accent"], ["O", 72, "paper"],
  ["R", 94, "sky"], ["S", 60, "stone"], ["A", 86, "accent"],
];

export async function Landing({ appHref }: { appHref?: string } = {}) {
  const { t, locale } = await getI18n();
  const img = (name: string) => `/landing/${name}.webp`;
  return (
    <div className="lp">
      <Motion />

      <main>
        <section className="lp-hero" aria-labelledby="lp-title">
          <div className="lp-top">
            <div className="lp-topstart">
              <LangSwitch path="/" className="lp-toplink" />
              <Link href="/preise" className="lp-toplink">{t("Preise")}</Link>
            </div>
            <Link href="/" className="lp-wordmark" aria-label="Transferborsa"><Logo /></Link>
            {appHref
              ? <Link href={appHref} className="lp-toplink lp-toplink-end">{t("Zur App")}</Link>
              : <Link href="/login" className="lp-toplink lp-toplink-end">{t("Anmelden")}</Link>}
          </div>

          <h1 id="lp-title" className="lp-hero-title">
            <span>{t("Hin voll.")}</span>{" "}
            <span>{t("Retour voll.")}</span>
          </h1>
          <p className="lp-hero-lead">
            {t("Transferborsa ist die Auftragsbörse für Taxiunternehmen und Reisebüros in Tirol: Transfers zum Flughafen München vergeben, Angebote vergleichen und leere Rückfahrten füllen.")}
          </p>

          <nav className="lp-folders" aria-label={t("Abschnitte")}>
            <div className="lp-folder" data-f="1"><a className="lp-tab" href="#boerse">{t("Börse")}</a></div>
            <div className="lp-folder" data-f="2"><a className="lp-tab" href="#ablauf">{t("Ablauf")}</a></div>
            <div className="lp-folder" data-f="3"><a className="lp-tab" href="#rechte">{t("Rechte")}</a></div>
            <div className="lp-folder" data-f="4"><a className="lp-tab" href="#strecken">{t("Strecken")}</a></div>
            <div className="lp-folder" data-f="5">
              <a className="lp-tab" href="#preis">{t("Preis")}</a>
              <Link href="/register" className="lp-btn lp-btn-ink">{t("Unternehmen registrieren")}</Link>
            </div>
          </nav>
        </section>

        <section id="boerse" className="lp-chapter lp-boerse" aria-labelledby="lp-boerse-h">
          <h2 id="lp-boerse-h" className="lp-h2" data-reveal>{t("Die Börse ausprobieren")}</h2>
          <div data-reveal>
            <RouteDemo locale={locale} />
          </div>
        </section>

        <section id="ablauf" className="lp-chapter lp-ablauf" aria-labelledby="lp-ablauf-h">
          <div className="lp-intro">
            <h2 id="lp-ablauf-h" className="lp-h2" data-reveal>{t("Von der Anfrage zur Fahrt")}</h2>
          </div>
          <div className="lp-panels" role="radiogroup" aria-label={t("Von der Anfrage zur Fahrt")} data-reveal>
            {STAGES.map((s, i) => (
              <div key={s.time} className="lp-panel" data-tone={s.tone}>
                <input type="radio" name="lp-stage" id={`lp-st-${s.tone}`} className="lp-sr" defaultChecked={i === 0} />
                <label htmlFor={`lp-st-${s.tone}`} className="lp-panel-name">{t(s.time)}</label>
                <div className="lp-panel-body">
                  <p>{t(s.text)}</p>
                  <img src={img(s.image)} width={s.w} height={s.h} alt={t(s.alt)} loading="lazy" decoding="async" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="rechte" className="lp-chapter lp-rechte" aria-labelledby="lp-rechte-h">
          <h2 id="lp-rechte-h" className="lp-h2" data-reveal>{t("Jeder sieht nur, was er braucht")}</h2>
          <div className="lp-rechte-grid">
            <figure className="lp-confirm" data-ui data-reveal>
              <p className="lp-confirm-head">{t("Buchungsbestätigung")}</p>
              <p className="lp-confirm-ref">TR-2611-0415</p>
              <dl>
                <dt>{t("Auftraggeber")}</dt><dd>{t("Reisebüro aus Kitzbühel")}</dd>
                <dt>{t("Ausführend")}</dt><dd>{t("Taxiunternehmen aus Schwaz")}</dd>
                <dt>{t("Strecke")}</dt><dd>{t("Flughafen München → Innsbruck")}</dd>
                <dt>{t("Abholung")}</dt><dd>{t("Fr 14.11., 09:15 Uhr")}</dd>
                <dt>{t("Leistung")}</dt><dd>{t("Limousine, 2 Pers., 2 Koffer")}</dd>
                <dt>{t("Storno")}</dt><dd>{t("kostenfrei bis 24 h vorher")}</dd>
                <dt>{t("Angenommen")}</dt><dd>{t("12.11., 16:02 Uhr")}</dd>
              </dl>
              <p className="lp-confirm-price"><span>{t("Bestätigter Preis")}</span><strong>205 €</strong></p>
              <figcaption className="lp-sr">{t("Beispiel einer Buchungsbestätigung")}</figcaption>
            </figure>
            <div className="lp-rights" data-reveal>
              {RIGHTS.map((g) => (
                <div key={g.group} className="lp-rights-group">
                  <h3>{t(g.group)}</h3>
                  <ul>
                    {g.rows.map(([kind, what, value]) => (
                      <li key={what}>
                        <span className="lp-t-what">{t(what)}</span>
                        <span className="lp-t-value">{t(value)}</span>
                        <span className="lp-sr">{t(kind)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="strecken" className="lp-chapter lp-strecken" aria-labelledby="lp-strecken-h">
          <h2 id="lp-strecken-h" className="lp-h2" data-reveal>{t("Wir starten auf diesen Strecken:")}</h2>
          <div className="lp-idx" data-reveal>
            <ul className="lp-idx-rows">
              {ROUTES.map((r, i) => (
                <li key={r.name} className="lp-idx-row" data-idx={i}>
                  <span className="lp-idx-name">{t(r.name)}</span>
                  <img className="lp-idx-inline" src={img(r.image)} width={r.w} height={r.h} alt={t(r.alt)} loading="lazy" decoding="async" />
                </li>
              ))}
              <li className="lp-idx-row" data-idx={ROUTES.length}>
                <span className="lp-idx-name">{MORE_PLACES}</span>
                <img className="lp-idx-inline" src={img("alpen")} width={1600} height={1067} alt={t(MORE_ALT)} loading="lazy" decoding="async" />
              </li>
            </ul>
            <div className="lp-idx-frame" aria-hidden="true">
              {ROUTES.map((r, i) => (
                <img key={r.name} data-for={i} className={i === 0 ? "is-on" : undefined} src={img(r.image)} width={r.w} height={r.h} alt="" loading="lazy" decoding="async" />
              ))}
              <img data-for={ROUTES.length} src={img("alpen")} width={1600} height={1067} alt="" loading="lazy" decoding="async" />
            </div>
          </div>
          <p className="lp-strecken-more" data-reveal>
            {t("Jeweils von und zum Flughafen München. Salzburg, Zürich, Südtirol und Norditalien folgen, sobald auf diesen Strecken regelmäßig vermittelt wird.")}
          </p>
        </section>

        <section id="preis" className="lp-chapter lp-preis" aria-labelledby="lp-preis-h">
          <div className="lp-ticket" data-reveal>
            <div className="lp-ticket-main">
              <h2 id="lp-preis-h" className="lp-ticket-price">
                <span>{t("Ab")}</span> <strong className="lp-ticket-amount">{formatCents(PLANS[0].priceCents, locale)}</strong> <span>{t("im Monat, ohne Provision.")}</span>
              </h2>
              <p>
                {t("Taxi- und Transferunternehmen zahlen einen festen Monatspreis, je nach Größe der Flotte. Für Reisebüros und Hotels ist Transferborsa kostenlos.")}
              </p>
            </div>
            <div className="lp-ticket-stub">
              <Link href="/preise" className="lp-btn lp-btn-ink">{t("Alle Tarife ansehen")}</Link>
              <Link href="/login" className="lp-textlink">{t("Bereits registriert? Anmelden")}</Link>
            </div>
          </div>
        </section>

        <section id="fragen" className="lp-chapter lp-faq" aria-labelledby="lp-fragen-h">
          <h2 id="lp-fragen-h" className="lp-h2" data-reveal>{t("Was Sie wissen sollten")}</h2>
          <div className="lp-faq-list" data-reveal>
            {FAQ.map(([q, a]) => (
              <details key={q} name="lp-faq">
                <summary>{t(q)}</summary>
                <p>{t(a)}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-cta" aria-labelledby="lp-wer">
          <h2 id="lp-wer" className="lp-cta-q" data-reveal>
            <span>{t("Taxi")}</span>
            <span>{t("oder Reisebüro?")}</span>
          </h2>
          <div className="lp-cta-row" data-reveal>
            <Link href="/register?type=TRANSPORT_COMPANY" className="lp-btn lp-btn-accent">{t("Als Taxiunternehmen")}</Link>
            <Link href="/register?type=TRAVEL_AGENCY" className="lp-btn lp-btn-paper">{t("Als Reisebüro")}</Link>
            <p>{t("Beide Wege führen zur Registrierung. Danach prüfen wir Ihr Unternehmen und schalten die passenden Funktionen frei.")}</p>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <p id="lp-mark" className="lp-mark" aria-label="Transferborsa">
          {MARK.map(([ch, h, tone], i) => (
            <span key={i} aria-hidden="true" data-tone={tone} style={{ height: `${h}%` }}>{ch}</span>
          ))}
        </p>
        <div className="lp-footer-grid">
          <p className="lp-footer-about">
            <strong>Transferborsa</strong>, {t("die Auftragsbörse für Personenbeförderung in Tirol und Bayern.")} {t("Pilotbetrieb ab Innsbruck.")}
          </p>
          <ul className="lp-footer-links">
            <li>{appHref ? <Link href={appHref}>{t("Zur App")}</Link> : <Link href="/login">{t("Anmelden")}</Link>}</li>
            <li><Link href="/register">{t("Registrieren")}</Link></li>
            <li><Link href="/preise">{t("Preise")}</Link></li>
            <li><Link href="/impressum">{t("Impressum")}</Link></li>
            <li><Link href="/datenschutz">{t("Datenschutz")}</Link></li>
            <li><Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link></li>
            <li><a href="#lp-title">{t("Nach oben")}</a></li>
          </ul>
          <a className="lp-contact" href="mailto:hallo@taxiroute.at?subject=Transferborsa%20Pilotbetrieb">hallo@taxiroute.at</a>
        </div>
        <p className="lp-credits">
          {t("Bilder:")}{" "}
          <a href="https://commons.wikimedia.org/w/index.php?curid=120699836">“AUT Hall in Tirol 02”</a> -wuppertaler, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>;{" "}
          <a href="https://unsplash.com/photos/VT6fiS_Msfg">Kitzbühel</a> Shpetim Ujkani, <a href="https://unsplash.com/license">Unsplash-Lizenz</a>;{" "}
          <a href="https://commons.wikimedia.org/w/index.php?curid=163989">“Festung kufstein”</a> Mb-tirol, <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>;{" "}
          <a href="https://commons.wikimedia.org/w/index.php?curid=47356981">“Seefeld in Tirol Austria from ESE on 2014-10-18”</a> Robert F. Tobler, CC BY-SA 4.0;{" "}
          <a href="https://commons.wikimedia.org/w/index.php?curid=14386656">“Flughafen-Munich Check in Terminal 2”</a> Usien, CC BY-SA 3.0;{" "}
          <a href="https://unsplash.com/photos/SE_eVebrPbM">Tiroler Alpen</a> Jonas Tebbe, <a href="https://unsplash.com/license">Unsplash-Lizenz</a>;{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Innsbruck_panoramic_by_TheTokl.webm">“Innsbruck panoramic by TheTokl” (Standbild)</a> TheTokl, CC BY-SA 4.0. Wikimedia Commons.{" "}
          {t("Schriften: Imbue und Albert Sans, SIL Open Font License")}. Innsbruck 2026.
        </p>
      </footer>
    </div>
  );
}
