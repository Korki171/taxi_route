import { getI18n } from "@/server/i18n";

type Org = Partial<Record<
  "name" | "legalName" | "street" | "postalCode" | "city" | "country" | "email" | "phone" |
  "website" | "vatId" | "registerNumber" | "contactPerson",
  string | null
>>;

export async function OrgProfileFields({ org = {}, disabled }: { org?: Org; disabled?: boolean }) {
  const v = (k: keyof Org) => org[k] ?? "";
  const { t } = await getI18n();
  return (
    <fieldset disabled={disabled} className="bare stack">
      <div className="fields">
        <label>{t("Firmenname")}<input name="name" defaultValue={v("name")} required /></label>
        <label>{t("Rechtlicher Name")} <small>{t("falls abweichend")}</small><input name="legalName" defaultValue={v("legalName")} /></label>
        <label>{t("Ansprechperson")}<input name="contactPerson" defaultValue={v("contactPerson")} /></label>
      </div>
      <div className="fields">
        <label>{t("Straße und Nr.")}<input name="street" defaultValue={v("street")} required /></label>
        <label>{t("PLZ")}<input name="postalCode" defaultValue={v("postalCode")} required /></label>
        <label>{t("Ort")}<input name="city" defaultValue={v("city")} required /></label>
        <label>{t("Land")} <small>{t("ISO-Code, z. B. AT")}</small><input name="country" defaultValue={v("country") || "AT"} maxLength={2} required /></label>
      </div>
      <div className="fields">
        <label>{t("Geschäftliche E-Mail")}<input name="email" type="email" defaultValue={v("email")} required /></label>
        <label>{t("Telefon")}<input name="phone" defaultValue={v("phone")} required /></label>
        <label>{t("Website")}<input name="website" defaultValue={v("website")} /></label>
      </div>
      <div className="fields">
        <label>{t("UID-Nummer")}<input name="vatId" defaultValue={v("vatId")} /></label>
        <label>{t("Firmenbuch-/Registernummer")}<input name="registerNumber" defaultValue={v("registerNumber")} /></label>
      </div>
    </fieldset>
  );
}
