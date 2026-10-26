import Link from "next/link";
import { Flash, type SP } from "@/components/ui";
import { OrgProfileFields } from "@/components/OrgProfileFields";
import { registerAction } from "../actions";

export default async function RegisterPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <main className="narrow">
      <h1>Unternehmen registrieren</h1>
      <p className="sub">
        Die Registrierung ist kostenlos. Marktplatzfunktionen werden freigeschaltet, sobald TaxiRoute Ihr
        Unternehmen geprüft hat.
      </p>
      <Flash searchParams={sp} />
      <form action={registerAction} className="stack">
        <div className="card stack">
          <h2>Art des Unternehmens</h2>
          <div className="checks">
            <label><input type="radio" name="type" value="TRANSPORT_COMPANY" required /> Taxi- oder Transferunternehmen</label>
            <label><input type="radio" name="type" value="TRAVEL_AGENCY" /> Reisebüro</label>
          </div>
          <p className="muted">
            Reisebüros können Transfers anfragen und buchen. Eigene Beförderungen anbieten dürfen nur Unternehmen,
            deren Konzession geprüft wurde – dies kann später separat beantragt werden.
          </p>
        </div>
        <div className="card stack">
          <h2>Unternehmensdaten</h2>
          <OrgProfileFields />
        </div>
        <div className="card stack">
          <h2>Ihr Zugang</h2>
          <div className="fields">
            <label>Name<input name="userName" required autoComplete="name" /></label>
            <label>E-Mail<input name="userEmail" type="email" required autoComplete="email" /></label>
            <label>Passwort <small>mind. 10 Zeichen</small><input name="password" type="password" minLength={10} required autoComplete="new-password" /></label>
          </div>
        </div>
        <div><button type="submit">Registrieren</button></div>
      </form>
      <p>Bereits registriert? <Link href="/login">Anmelden</Link></p>
    </main>
  );
}
