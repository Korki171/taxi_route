"use client";

import { useEffect, useState } from "react";

export type LocationStepText = { hint: string; allow: string; on: string; denied: string };

/** Erster Start der Fahrer-Ansicht: Standortfreigabe des Geräts mit einem Tipp abfragen. */
export function LocationStep({ text }: { text: LocationStepText }) {
  const [state, setState] = useState<"off" | "on" | "denied">("off");

  useEffect(() => {
    let alive = true;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((p) => {
        if (alive) setState(p.state === "granted" ? "on" : p.state === "denied" ? "denied" : "off");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function allow() {
    navigator.geolocation?.getCurrentPosition(
      () => setState("on"),
      (e) => setState(e.code === e.PERMISSION_DENIED ? "denied" : "on"),
      { enableHighAccuracy: true, timeout: 20_000 },
    );
  }

  return (
    <div className="push-toggle">
      <div><p className="price-note">{state === "on" ? text.on : state === "denied" ? text.denied : text.hint}</p></div>
      {state === "off" && <button type="button" onClick={allow}>{text.allow}</button>}
    </div>
  );
}
