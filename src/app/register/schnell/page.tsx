import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { Flash, type SP } from "@/components/ui";
import { safeInternalPath } from "@/lib/safe-path";
import { getI18n } from "@/server/i18n";
import { quickRegisterAction } from "../../actions";

/**
 * Kurze Registrierung für Taxi- und Transferunternehmen, gedacht fürs Handy (Einstieg über einen geteilten Auftrag).
 * Sechs Felder, die das Handy selbst ausfüllen kann. Adresse und Nachweise folgen später im Profil.
 */
export default async function QuickRegisterPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  const next = safeInternalPath(typeof sp.next === "string" ? sp.next : "", "");
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <AuthLayout path={`/register/schnell${q}`}>
      <h1>{t("In einer Minute dabei")}</h1>
      <p className="sub">{t("Kostenlos für den Start. Adresse und Nachweise tragen Sie später nach.")}</p>
      <Flash searchParams={sp} />
      <form action={quickRegisterAction} className="stack">
        <input type="hidden" name="next" value={next} />
        <label><span>{t("Firmenname")}</span><input name="company" required autoComplete="organization" enterKeyHint="next" /></label>
        <label><span>{t("Ihr Name")}</span><input name="name" required autoComplete="name" enterKeyHint="next" /></label>
        <label><span>{t("Ort")}</span><input name="city" required autoComplete="address-level2" placeholder="Innsbruck" enterKeyHint="next" /></label>
        <label><span>{t("Handynummer")} <small>{t("mit Landesvorwahl")}</small></span><input name="phone" type="tel" required inputMode="tel" autoComplete="tel" defaultValue="+43 " pattern="\+[0-9][0-9 \(\)\/\-]{5,}" title={t("Mit Landesvorwahl, z. B. +43 512 123456")} enterKeyHint="next" /></label>
        <label><span>{t("E-Mail")}</span><input name="email" type="email" required inputMode="email" autoComplete="email" autoCapitalize="none" enterKeyHint="next" /></label>
        <label><span>{t("Passwort")} <small>{t("mind. 10 Zeichen")}</small></span><input name="password" type="password" minLength={10} required autoComplete="new-password" enterKeyHint="done" /></label>
        <button type="submit" className="accent">{next ? t("Registrieren und Fahrt ansehen") : t("Registrieren")}</button>
        <p className="muted flush">{t("Mit der Registrierung akzeptieren Sie die")} <Link href="/nutzungsbedingungen">{t("Nutzungsbedingungen")}</Link> {t("und haben die")} <Link href="/datenschutz">{t("Datenschutzerklärung")}</Link> {t("gelesen.")}</p>
      </form>
      <p className="auth-alt">{t("Bereits registriert?")} <Link href={`/login${q}`}>{t("Anmelden")}</Link></p>
      <p className="auth-alt">{t("Reisebüro oder Hotel?")} <Link href="/register?type=TRAVEL_AGENCY">{t("Zur ausführlichen Registrierung")}</Link></p>
    </AuthLayout>
  );
}
