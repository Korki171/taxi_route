import { AppShell } from "@/components/AppShell";
import { getI18n } from "@/server/i18n";
import { requireActor } from "@/server/web";

export default async function NoOrg() {
  const actor = await requireActor();
  const { t } = await getI18n();
  return (
    <AppShell actor={actor} narrow>
      <h1>{t("Keine Organisation")}</h1>
      <p>{t("Ihr Konto ist derzeit keiner Organisation zugeordnet. Bitten Sie Ihr Unternehmen um eine neue Einladung.")}</p>
    </AppShell>
  );
}
