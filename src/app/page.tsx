import { Landing } from "@/components/landing/Landing";
import { getActor } from "@/server/web";

/**
 * Die Website ist auch für angemeldete Nutzer erreichbar. Statt „Anmelden“ führt oben
 * ein Link zurück in die App, passend zur Rolle.
 */
export default async function Home() {
  const actor = await getActor();
  const appHref = !actor ? undefined
    : actor.org ? (actor.org.role === "DRIVER" ? "/fahrer" : "/dashboard")
    : actor.isPlatformAdmin ? "/admin" : "/no-organization";
  return <Landing appHref={appHref} />;
}
