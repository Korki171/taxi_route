import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { Flash, type SP } from "@/components/ui";
import { OrgProfileFields } from "@/components/OrgProfileFields";
import { getI18n } from "@/server/i18n";
import { registerAction } from "../actions";

export default async function RegisterPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  return (
    <AuthLayout path="/register" wide>
      <h1>{t("Unternehmen registrieren")}</h1>
      <p className="sub">{t("Die Registrierung ist kostenlos. Marktplatzfunktionen werden freigeschaltet, sobald Transferborsa Ihr Unternehmen geprüft hat.")}</p>
      <Flash searchParams={sp} />
      <form action={registerAction} className="stack">
        <section className="card section stack">
          <h2>{t("Art des Unternehmens")}</h2>
          <div className="choice">
            <label><input type="radio" name="type" value="TRANSPORT_COMPANY" required defaultChecked={sp.type === "TRANSPORT_COMPANY"} /> {t("Taxi- oder Transferunternehmen")}</label>
            <label><input type="radio" name="type" value="TRAVEL_AGENCY" defaultChecked={sp.type === "TRAVEL_AGENCY"} /> {t("Reisebüro")}</label>
          </div>
          <p className="muted flush">{t("Reisebüros können Transfers anfragen und buchen. Eigene Beförderungen anbieten dürfen nur Unternehmen, deren Konzession geprüft wurde – dies kann später separat beantragt werden.")}</p>
        </section>
        <section className="card section stack">
          <h2>{t("Unternehmensdaten")}</h2>
          <OrgProfileFields />
        </section>
        <section className="card section stack">
          <h2>{t("Ihr Zugang")}</h2>
          <div className="fields">
            <label>{t("Name")}<input name="userName" required autoComplete="name" /></label>
            <label>{t("E-Mail")}<input name="userEmail" type="email" required autoComplete="email" /></label>
            <label>{t("Passwort")} <small>{t("mind. 10 Zeichen")}</small><input name="password" type="password" minLength={10} required autoComplete="new-password" /></label>
          </div>
        </section>
        <p className="muted flush">{t("Mit der Registrierung akzeptieren Sie die")} <Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link> {t("und haben die")} <Link href="/datenschutz">{t("Datenschutzerklärung")}</Link> {t("gelesen.")}</p>
        <div><button type="submit" className="accent">{t("Registrieren")}</button></div>
      </form>
      <p className="auth-alt">{t("Bereits registriert?")} <Link href="/login">{t("Anmelden")}</Link></p>
    </AuthLayout>
  );
}
