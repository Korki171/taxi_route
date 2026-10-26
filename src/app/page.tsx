import { redirect } from "next/navigation";
import { getActor } from "@/server/web";

export default async function Home() {
  const actor = await getActor();
  redirect(actor ? (actor.org ? "/dashboard" : actor.isPlatformAdmin ? "/admin" : "/no-organization") : "/login");
}
