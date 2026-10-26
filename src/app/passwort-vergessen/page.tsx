import Link from "next/link";
import { LangSwitch } from "@/components/LangSwitch";
import { Flash, type SP } from "@/components/ui";
import { getI18n } from "@/server/i18n";
import { requestPasswordResetAction } from "../actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  return (
    <main className="narrow">
      <p className="right"><LangSwitch path="/passwort-vergessen" /></p>
      <h1>{t("Passwort vergessen")}</h1>
      <p className="sub">{t("Wir schicken Ihnen einen Link, mit dem Sie ein neues Passwort festlegen können. Er ist eine Stunde gültig.")}</p>
      <Flash searchParams={sp} />
      <div className="card">
        <form action={requestPasswordResetAction} className="stack">
          <label>{t("E-Mail")}<input name="email" type="email" autoComplete="username" required /></label>
          <div><button type="submit">{t("Link anfordern")}</button></div>
        </form>
      </div>
      <p><Link href="/login">{t("Zurück zur Anmeldung")}</Link></p>
    </main>
  );
}
