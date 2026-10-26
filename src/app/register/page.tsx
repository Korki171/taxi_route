import Link from "next/link";
import { Flash, type SP } from "@/components/ui";
import { OrgProfileFields } from "@/components/OrgProfileFields";
import { LangSwitch } from "@/components/LangSwitch";
import { getI18n } from "@/server/i18n";
import { registerAction } from "../actions";

export default async function RegisterPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  return (
    <main className="narrow">
      <p className="right"><LangSwitch path="/register" /></p>
      <h1>{t("Unternehmen registrieren")}</h1>
      <p className="sub">{t("Die Registrierung ist kostenlos. Marktplatzfunktionen werden freigeschaltet, sobald TaxiRoute Ihr Unternehmen geprüft hat.")}</p>
      <Flash searchParams={sp} />
      <form action={registerAction} className="stack">
        <div className="card stack">
          <h2>{t("Art des Unternehmens")}</h2>
          <div className="checks">
            <label><input type="radio" name="type" value="TRANSPORT_COMPANY" required defaultChecked={sp.type === "TRANSPORT_COMPANY"} /> {t("Taxi- oder Transferunternehmen")}</label>
            <label><input type="radio" name="type" value="TRAVEL_AGENCY" defaultChecked={sp.type === "TRAVEL_AGENCY"} /> {t("Reisebüro")}</label>
          </div>
          <p className="muted">{t("Reisebüros können Transfers anfragen und buchen. Eigene Beförderungen anbieten dürfen nur Unternehmen, deren Konzession geprüft wurde – dies kann später separat beantragt werden.")}</p>
        </div>
        <div className="card stack">
          <h2>{t("Unternehmensdaten")}</h2>
          <OrgProfileFields />
        </div>
        <div className="card stack">
          <h2>{t("Ihr Zugang")}</h2>
          <div className="fields">
            <label>{t("Name")}<input name="userName" required autoComplete="name" /></label>
            <label>{t("E-Mail")}<input name="userEmail" type="email" required autoComplete="email" /></label>
            <label>{t("Passwort")} <small>{t("mind. 10 Zeichen")}</small><input name="password" type="password" minLength={10} required autoComplete="new-password" /></label>
          </div>
        </div>
        <p className="muted">{t("Mit der Registrierung akzeptieren Sie die")} <Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link> {t("und haben die")} <Link href="/datenschutz">{t("Datenschutzerklärung")}</Link> {t("gelesen.")}</p>
        <div><button type="submit">{t("Registrieren")}</button></div>
      </form>
      <p>{t("Bereits registriert?")} <Link href="/login">{t("Anmelden")}</Link></p>
    </main>
  );
}
