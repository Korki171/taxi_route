import { getI18n } from "@/server/i18n";

/** Umschalter DE/EN. `path` ist die Seite, auf die nach dem Wechsel zurückgeleitet wird. */
export async function LangSwitch({ path = "/", className }: { path?: string; className?: string }) {
  const { locale } = await getI18n();
  const other = locale === "de" ? "en" : "de";
  return (
    <a href={`/lang/${other}?next=${encodeURIComponent(path)}`} className={className ?? "lang"} hrefLang={other} lang={other}>
      {other === "en" ? "English" : "Deutsch"}
    </a>
  );
}
