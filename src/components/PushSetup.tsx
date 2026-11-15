import { getI18n } from "@/server/i18n";
import { nativePushConfigured, vapidPublicKey } from "@/server/push";
import { PushToggle } from "./PushToggle";

/** Ein-/Ausschalter für Mitteilungen auf diesem Gerät; ohne eingerichteten Push-Dienst erscheint nichts. */
export async function PushSetup({ banner = false, driver = false }: { banner?: boolean; driver?: boolean }) {
  const key = vapidPublicKey();
  if (!key && !nativePushConfigured()) return null;
  const { t } = await getI18n();
  return (
    <PushToggle
      vapidKey={key}
      banner={banner}
      text={{
        title: driver ? t("Neue Fahrten sofort aufs Handy") : t("Neue Aufträge sofort aufs Handy"),
        hint: driver ? t("Mitteilung, sobald Ihnen die Disposition eine Fahrt zuweist.") : t("Mitteilung bei jedem neuen Auftrag, mit „Übernehmen“ direkt in der Mitteilung."),
        enable: t("Mitteilungen einschalten"),
        disable: t("Mitteilungen ausschalten"),
        on: t("Mitteilungen sind auf diesem Gerät eingeschaltet."),
        denied: t("Mitteilungen sind für diese Seite im Browser blockiert. Bitte in den Einstellungen des Browsers erlauben."),
        iosInstall: t("Auf dem iPhone: Seite über „Teilen“ zum Home-Bildschirm hinzufügen und von dort öffnen, dann lassen sich Mitteilungen einschalten."),
        unsupported: t("Dieser Browser unterstützt keine Mitteilungen."),
        failed: t("Mitteilungen konnten nicht eingeschaltet werden. Bitte erneut versuchen."),
      }}
    />
  );
}
