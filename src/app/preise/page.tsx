import type { Metadata } from "next";
import { Pricing } from "@/components/landing/Pricing";
import { getI18n } from "@/server/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: `${t("Preise")} · Transferborsa`,
    description: t("Ein fester Monatspreis für Taxi- und Transferunternehmen. Für Reisebüros und Hotels ist Transferborsa kostenlos."),
  };
}

export default function PreisePage() {
  return <Pricing />;
}
