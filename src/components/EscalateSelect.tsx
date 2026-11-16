import { getI18n } from "@/server/i18n";
import { ESCALATE_CHOICES, ESCALATE_LABEL } from "@/server/services/partners";

/** Auswahl der Frist für die automatische Weitergabe (leer = nicht automatisch). */
export async function EscalateSelect({ name, value }: { name: string; value: number | null }) {
  const { t } = await getI18n();
  // Ältere Aufträge können eine Frist haben, die nicht mehr zur Auswahl steht.
  const extra = value != null && !(ESCALATE_CHOICES as readonly number[]).includes(value) ? [value] : [];
  return (
    <select name={name} defaultValue={value == null ? "" : String(value)}>
      {extra.map((m) => <option key={m} value={m} disabled>{t("{n} Minuten", { n: m })}</option>)}
      {ESCALATE_CHOICES.map((m) => <option key={m} value={m}>{t(ESCALATE_LABEL[m])}</option>)}
      <option value="">{t("Nicht automatisch")}</option>
    </select>
  );
}
