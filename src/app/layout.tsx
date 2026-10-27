import type { Metadata } from "next";
import "@fontsource-variable/albert-sans";
import "@fontsource-variable/imbue";
import "./globals.css";
import { getI18n } from "@/server/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: "Transferborsa", description: t("B2B-Auftragsbörse für Taxi-/Transferunternehmen und Reisebüros") };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getI18n();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
