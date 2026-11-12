import { getI18n } from "@/server/i18n";
import { Req } from "./Req";

type Org = Partial<Record<
  "name" | "legalName" | "street" | "postalCode" | "city" | "country" | "email" | "phone" |
  "website" | "vatId" | "registerNumber" | "contactPerson",
  string | null
>>;

/**
 * Firmendaten für Registrierung und Profil. Pflichtfelder tragen ein Sternchen; die Formate (PLZ, Land, Telefon,
 * Website, UID) stehen als Beispiel im Feld und werden im Browser und auf dem Server gleich geprüft (src/server/validation.ts).
 */
export async function OrgProfileFields({ org = {}, disabled }: { org?: Org; disabled?: boolean }) {
  const v = (k: keyof Org) => org[k] ?? "";
  const { t } = await getI18n();
  const req = <Req label={t("Pflichtfeld")} />;
  return (
    <fieldset disabled={disabled} className="bare stack">
      <p className="muted flush">{t("Felder mit * sind Pflichtfelder.")}</p>
      <div className="fields">
        <label><span>{t("Firmenname")} {req}</span><input name="name" defaultValue={v("name")} required autoComplete="organization" /></label>
        <label><span>{t("Rechtlicher Name")} <small>{t("falls abweichend")}</small></span><input name="legalName" defaultValue={v("legalName")} /></label>
        <label><span>{t("Ansprechperson")}</span><input name="contactPerson" defaultValue={v("contactPerson")} autoComplete="name" /></label>
      </div>
      <div className="fields">
        <label><span>{t("Straße und Nr.")} {req}</span><input name="street" defaultValue={v("street")} required autoComplete="street-address" placeholder="Maria-Theresien-Straße 1" /></label>
        <label><span>{t("PLZ")} {req} <small>{t("4 bis 5 Ziffern")}</small></span><input name="postalCode" defaultValue={v("postalCode")} required inputMode="numeric" pattern="[0-9]{4,5}" title={t("4 bis 5 Ziffern, z. B. 6020")} autoComplete="postal-code" placeholder="6020" /></label>
        <label><span>{t("Ort")} {req}</span><input name="city" defaultValue={v("city")} required autoComplete="address-level2" placeholder="Innsbruck" /></label>
        <label><span>{t("Land")} {req} <small>{t("ISO-Code, z. B. AT")}</small></span><input name="country" defaultValue={v("country") || "AT"} maxLength={2} required pattern="[A-Za-z]{2}" title={t("Zwei Buchstaben, z. B. AT oder DE")} autoComplete="country" placeholder="AT" /></label>
      </div>
      <div className="fields">
        <label><span>{t("Geschäftliche E-Mail")} {req}</span><input name="email" type="email" defaultValue={v("email")} required autoComplete="email" placeholder="office@firma.at" /></label>
        <label><span>{t("Telefon")} {req} <small>{t("mit Landesvorwahl")}</small></span><input name="phone" type="tel" defaultValue={v("phone")} required pattern="\+[0-9][0-9 \(\)\/\-]{5,}" title={t("Mit Landesvorwahl, z. B. +43 512 123456")} autoComplete="tel" placeholder="+43 512 123456" /></label>
        <label><span>{t("Website")} <small>{t("mit https://")}</small></span><input name="website" type="url" defaultValue={v("website")} autoComplete="url" placeholder="https://www.firma.at" /></label>
      </div>
      <div className="fields">
        <label><span>{t("UID-Nummer")} <small>{t("z. B. ATU12345678")}</small></span><input name="vatId" defaultValue={v("vatId")} pattern="[A-Za-z]{2}[A-Za-z0-9]{8,12}" title={t("Ländercode und Nummer ohne Leerzeichen, z. B. ATU12345678")} placeholder="ATU12345678" /></label>
        <label><span>{t("Firmenbuch-/Registernummer")}</span><input name="registerNumber" defaultValue={v("registerNumber")} placeholder="FN 123456 a" /></label>
      </div>
    </fieldset>
  );
}
