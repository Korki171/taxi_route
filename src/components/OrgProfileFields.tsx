type Org = Partial<Record<
  "name" | "legalName" | "street" | "postalCode" | "city" | "country" | "email" | "phone" |
  "website" | "vatId" | "registerNumber" | "contactPerson",
  string | null
>>;

export function OrgProfileFields({ org = {}, disabled }: { org?: Org; disabled?: boolean }) {
  const v = (k: keyof Org) => org[k] ?? "";
  return (
    <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0 }} className="stack">
      <div className="fields">
        <label>Firmenname<input name="name" defaultValue={v("name")} required /></label>
        <label>Rechtlicher Name <small>falls abweichend</small><input name="legalName" defaultValue={v("legalName")} /></label>
        <label>Ansprechperson<input name="contactPerson" defaultValue={v("contactPerson")} /></label>
      </div>
      <div className="fields">
        <label>Straße und Nr.<input name="street" defaultValue={v("street")} required /></label>
        <label>PLZ<input name="postalCode" defaultValue={v("postalCode")} required /></label>
        <label>Ort<input name="city" defaultValue={v("city")} required /></label>
        <label>Land <small>ISO-Code, z. B. AT</small><input name="country" defaultValue={v("country") || "AT"} maxLength={2} required /></label>
      </div>
      <div className="fields">
        <label>Geschäftliche E-Mail<input name="email" type="email" defaultValue={v("email")} required /></label>
        <label>Telefon<input name="phone" defaultValue={v("phone")} required /></label>
        <label>Website<input name="website" defaultValue={v("website")} /></label>
      </div>
      <div className="fields">
        <label>UID-Nummer<input name="vatId" defaultValue={v("vatId")} /></label>
        <label>Firmenbuch-/Registernummer<input name="registerNumber" defaultValue={v("registerNumber")} /></label>
      </div>
    </fieldset>
  );
}
