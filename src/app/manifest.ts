import type { MetadataRoute } from "next";

/** Lässt sich die Fahrer-Ansicht auf dem Handy als App auf den Startbildschirm legen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaxiRoute",
    short_name: "TaxiRoute",
    description: "Fahrten und Disposition für Taxi- und Transferunternehmen",
    start_url: "/fahrer",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#0b5cad",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
