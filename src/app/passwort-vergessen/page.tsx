import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { Flash, type SP } from "@/components/ui";
import { getI18n } from "@/server/i18n";
import { requestPasswordResetAction } from "../actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  return (
    <AuthLayout path="/passwort-vergessen">
      <h1>{t("Passwort vergessen")}</h1>
      <p className="sub">{t("Wir schicken Ihnen einen Link, mit dem Sie ein neues Passwort festlegen können. Er ist eine Stunde gültig.")}</p>
      <Flash searchParams={sp} />
      <form action={requestPasswordResetAction} className="stack">
        <label>{t("E-Mail")}<input name="email" type="email" autoComplete="username" required /></label>
        <div><button type="submit" className="accent">{t("Link anfordern")}</button></div>
      </form>
      <p className="auth-alt"><Link href="/login">{t("Zurück zur Anmeldung")}</Link></p>
    </AuthLayout>
  );
}
