import { AppShell } from "@/components/AppShell";
import { requireActor } from "@/server/web";

export default async function NoOrg() {
  const actor = await requireActor();
  return (
    <AppShell actor={actor} narrow>
      <h1>Keine Organisation</h1>
      <p>Ihr Konto ist derzeit keiner Organisation zugeordnet. Bitten Sie Ihr Unternehmen um eine neue Einladung.</p>
    </AppShell>
  );
}
