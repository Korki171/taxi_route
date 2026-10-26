import Link from "next/link";
import { Flash, type SP } from "@/components/ui";
import { loginAction } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <main className="narrow">
      <h1>TaxiRoute</h1>
      <p className="sub">Anmeldung für Transferunternehmen, Reisebüros und Administratoren</p>
      <Flash searchParams={sp} />
      <div className="card">
        <form action={loginAction} className="stack">
          <input type="hidden" name="next" value={sp.next ?? ""} />
          <label>E-Mail<input name="email" type="email" autoComplete="username" required /></label>
          <label>Passwort<input name="password" type="password" autoComplete="current-password" required /></label>
          <div><button type="submit">Anmelden</button></div>
        </form>
      </div>
      <p>Noch kein Konto? <Link href="/register">Unternehmen registrieren</Link></p>
    </main>
  );
}
