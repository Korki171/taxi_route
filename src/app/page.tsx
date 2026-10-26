import { redirect } from "next/navigation";
import { Landing } from "@/components/landing/Landing";
import { getActor } from "@/server/web";

export default async function Home() {
  const actor = await getActor();
  if (actor) redirect(actor.org ? "/dashboard" : actor.isPlatformAdmin ? "/admin" : "/no-organization");
  return <Landing />;
}
