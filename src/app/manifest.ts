import type { MetadataRoute } from "next";

/** Lässt sich die Fahrer-Ansicht auf dem Handy als App auf den Startbildschirm legen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Transferborsa",
    short_name: "Transferborsa",
    description: "Fahrten und Disposition für Taxi- und Transferunternehmen",
    start_url: "/fahrer",
    display: "standalone",
    background_color: "#0f0f0f",
    theme_color: "#0f0f0f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
