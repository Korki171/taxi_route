import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { Flash, type SP } from "@/components/ui";
import { getI18n } from "@/server/i18n";
import { loginAction } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  return (
    <AuthLayout path="/login">
      <h1>{t("Anmelden")}</h1>
      <p className="sub">{t("Anmeldung für Transferunternehmen, Reisebüros und Administratoren")}</p>
      <Flash searchParams={sp} />
      <form action={loginAction} className="stack">
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <label>{t("E-Mail")}<input name="email" type="email" autoComplete="username" required /></label>
        <label>{t("Passwort")}<input name="password" type="password" autoComplete="current-password" required /></label>
        <div className="actions-row spread">
          <button type="submit" className="accent">{t("Anmelden")}</button>
          <Link href="/passwort-vergessen">{t("Passwort vergessen?")}</Link>
        </div>
      </form>
      <p className="auth-alt">{t("Noch kein Konto?")} <Link href="/register">{t("Unternehmen registrieren")}</Link></p>
    </AuthLayout>
  );
}
