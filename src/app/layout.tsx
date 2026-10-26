import type { Metadata } from "next";
import "@fontsource-variable/albert-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaxiRoute",
  description: "B2B-Auftragsbörse für Taxi-/Transferunternehmen und Reisebüros",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
