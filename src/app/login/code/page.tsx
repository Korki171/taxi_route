import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";
import { Flash, type SP } from "@/components/ui";
import { getI18n } from "@/server/i18n";
import { verifyLoginCodeAction } from "../../actions";

/** Zweiter Schritt der Anmeldung: sechsstelliger Code aus der E-Mail. */
export default async function LoginCodePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  if (!sp.c) redirect("/login");
  const { t } = await getI18n();
  return (
    <AuthLayout path="/login">
      <h1>{t("Code eingeben")}</h1>
      <p className="sub">{t("Wir haben Ihnen einen sechsstelligen Code per E-Mail geschickt. Er ist 10 Minuten gültig.")}</p>
      <Flash searchParams={sp} />
      <form action={verifyLoginCodeAction} className="stack">
        <input type="hidden" name="c" value={sp.c} />
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <label>{t("Code")}<input name="code" inputMode="numeric" pattern="[0-9 ]{6,7}" maxLength={7} autoComplete="one-time-code" autoFocus required /></label>
        <div className="actions-row spread">
          <button type="submit" className="accent">{t("Anmelden")}</button>
          <Link href="/login">{t("Neu anmelden")}</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
