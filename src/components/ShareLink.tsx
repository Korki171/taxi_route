"use client";

import { useState } from "react";

/**
 * Teilt einen Link über das Teilen-Menü des Handys (WhatsApp, SMS, …). Wo es das nicht gibt,
 * wird der Text kopiert; der Link daneben öffnet WhatsApp direkt.
 */
export function ShareLink({ url, text, label, copied, whatsapp }: { url: string; text: string; label: string; copied: string; whatsapp: string }) {
  const [done, setDone] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch {
      // abgebrochen oder nicht erlaubt: nichts zu tun
    }
  }

  return (
    <div className="share-row">
      <button type="button" className="accent" onClick={share}>{done ? copied : label}</button>
      <a className="btn secondary" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener">{whatsapp}</a>
    </div>
  );
}
