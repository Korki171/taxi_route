import Link from "next/link";
import { Flash, type SP } from "@/components/ui";
import { AppError } from "@/server/errors";
import { getI18n } from "@/server/i18n";
import { checkPasswordResetToken } from "@/server/services/password-reset";
import { resetPasswordAction } from "../../actions";

export default async function ResetPasswordPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: SP }) {
  const { token } = await params;
  const sp = await searchParams;
  const { t } = await getI18n();
  const valid = await checkPasswordResetToken(token).then(() => true, (e) => {
    if (e instanceof AppError) return false;
    throw e;
  });
  return (
    <main className="narrow">
      <h1>{t("Neues Passwort festlegen")}</h1>
      <Flash searchParams={sp} />
      {valid ? (
        <div className="card">
          <form action={resetPasswordAction.bind(null, token)} className="stack">
            <label>{t("Neues Passwort")} <small>{t("mind. 10 Zeichen")}</small><input name="password" type="password" minLength={10} required autoComplete="new-password" /></label>
            <label>{t("Passwort wiederholen")}<input name="password2" type="password" minLength={10} required autoComplete="new-password" /></label>
            <div><button type="submit">{t("Passwort speichern")}</button></div>
          </form>
        </div>
      ) : (
        <>
          <div className="flash error">{t("Der Link ist ungültig oder abgelaufen.")}</div>
          <p><Link href="/passwort-vergessen">{t("Neuen Link anfordern")}</Link></p>
        </>
      )}
    </main>
  );
}
