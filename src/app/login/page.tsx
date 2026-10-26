import Link from "next/link";
import { LangSwitch } from "@/components/LangSwitch";
import { Flash, type SP } from "@/components/ui";
import { getI18n } from "@/server/i18n";
import { loginAction } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  return (
    <main className="narrow">
      <p className="right"><LangSwitch path="/login" /></p>
      <h1><Link href="/" className="plain">TaxiRoute</Link></h1>
      <p className="sub">{t("Anmeldung für Transferunternehmen, Reisebüros und Administratoren")}</p>
      <Flash searchParams={sp} />
      <div className="card">
        <form action={loginAction} className="stack">
          <input type="hidden" name="next" value={sp.next ?? ""} />
          <label>{t("E-Mail")}<input name="email" type="email" autoComplete="username" required /></label>
          <label>{t("Passwort")}<input name="password" type="password" autoComplete="current-password" required /></label>
          <div className="inline" style={{ justifyContent: "space-between", width: "100%" }}>
            <button type="submit">{t("Anmelden")}</button>
            <Link href="/passwort-vergessen">{t("Passwort vergessen?")}</Link>
          </div>
        </form>
      </div>
      <p>{t("Noch kein Konto?")} <Link href="/register">{t("Unternehmen registrieren")}</Link></p>
    </main>
  );
}
