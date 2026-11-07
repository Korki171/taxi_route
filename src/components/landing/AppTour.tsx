import { translate, type Locale } from "@/lib/i18n";

/** Bildschirmfotos der App liegen je Sprache unter public/landing/app (Demo-Daten, keine echten Kunden). */
const shot = (name: string, locale: Locale) => `/landing/app/${name}-${locale === "en" ? "en" : "de"}.webp`;

function Browser({ src, url, alt }: { src: string; url: string; alt: string }) {
  return (
    <div className="lp-app-browser lp-app-wide">
      <div className="lp-app-bar" aria-hidden="true"><i /><i /><i /><span>{url}</span></div>
      <img src={src} width={1600} height={1000} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}

function Phone({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`lp-app-phone ${className}`}>
      <img src={src} width={700} height={1515} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}

/** „Was Transferborsa kann“: vier Funktionen der App, je mit Bildschirmfoto. Am Handy die Handy-Ansicht. */
export function AppTour({ locale }: { locale: Locale }) {
  const t = (k: string) => translate(locale, k);
  const s = (name: string) => shot(name, locale);
  const rows = [
    {
      key: "boerse",
      tone: "stone",
      title: t("Aufträge finden"),
      text: t("Die Börse zeigt alle offenen Fahrten geprüfter Unternehmen. Filtern nach Strecke, Datum und Fahrzeug, dann übernehmen oder ein Angebot abgeben."),
      who: t("Für Taxiunternehmen"),
      pic: (
        <>
          <Browser src={s("boerse")} url="transferborsa.com/boerse" alt={t("Die Auftragsbörse mit offenen Fahrten, Filtern und Preisen")} />
          <Phone className="lp-app-narrow" src={s("boerse-handy")} alt={t("Die Auftragsbörse am Handy mit offenen Fahrten und Preisen")} />
        </>
      ),
    },
    {
      key: "angebote",
      tone: "sky",
      title: t("Angebote vergleichen"),
      text: t("Ein Reisebüro stellt einen Transfer ein und sieht die Angebote nebeneinander: Preis, Fahrzeug, Nachricht. Annehmen, und die Buchung steht."),
      who: t("Für Reisebüros und Hotels"),
      pic: (
        <>
          <Browser src={s("angebote")} url="transferborsa.com/boerse/auftrag" alt={t("Ein Auftrag mit zwei Angeboten zum Annehmen oder Ablehnen")} />
          <Phone className="lp-app-narrow" src={s("angebote-handy")} alt={t("Zwei Angebote zu einem Auftrag am Handy, je mit Preis und Knopf zum Annehmen")} />
        </>
      ),
    },
    {
      key: "live",
      tone: "ink",
      title: t("Flotte live sehen"),
      text: t("Die Live-Karte zeigt, wo Ihre Wagen gerade sind und welche Fahrt sie haben. Fahrer teilen ihren Standort über die Handy-Ansicht, nur während der Schicht."),
      who: t("Für Taxiunternehmen"),
      pic: (
        <>
          <Browser src={s("live")} url="transferborsa.com/flotte/live" alt={t("Die Live-Karte mit Fahrzeugen, Route und Ankunftszeit")} />
          <Phone className="lp-app-float" src={s("fahrer")} alt={t("Die Fahrer-Ansicht am Handy mit laufender Schicht und der nächsten Fahrt")} />
        </>
      ),
    },
    {
      key: "pdf",
      tone: "stone",
      title: t("Bestätigung als PDF"),
      text: t("Jede Buchung erzeugt eine Auftragsbestätigung mit Preis, Strecke und Bedingungen, auf Deutsch oder Englisch. Fertig zum Weiterleiten an den Gast."),
      who: t("Für beide Seiten"),
      pic: <img className="lp-app-paper" src={s("pdf")} width={1000} height={943} alt={t("Auftragsbestätigung als PDF mit Auftraggeber, Strecke und vereinbartem Preis")} loading="lazy" decoding="async" />,
    },
  ];

  return (
    <section id="app" className="lp-chapter lp-app" aria-labelledby="lp-app-h">
      <p className="lp-app-kicker">{t("Die App")}</p>
      <h2 id="lp-app-h" className="lp-h2" data-reveal>{t("Was Transferborsa kann")}</h2>
      {rows.map((r, i) => (
        <div key={r.key} className="lp-app-row" data-reveal>
          <div className="lp-app-text">
            <p className="lp-app-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</p>
            <h3>{r.title}</h3>
            <p>{r.text}</p>
            <p className="lp-app-who">{r.who}</p>
          </div>
          <div className="lp-app-pic" data-tone={r.tone}>{r.pic}</div>
        </div>
      ))}
    </section>
  );
}
