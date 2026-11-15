"use client";

import { useEffect, useRef, useState } from "react";
import { fmtMinutes } from "@/lib/format";
import { routeGuide } from "@/lib/price-guide";

/**
 * Zeigt beim Einstellen Entfernung, Fahrzeit und einen Richtpreis, sobald „Von“ und „Nach“ gewählt sind.
 * Liest die beiden Ortsfelder des umgebenden Formulars, es gibt nichts zusätzlich auszufüllen.
 */
export function RouteGuide({ text }: { text: { line: string; hint: string } }) {
  const el = useRef<HTMLParagraphElement>(null);
  const [route, setRoute] = useState<ReturnType<typeof routeGuide>>(null);

  useEffect(() => {
    const form = el.current?.closest("form");
    if (!form) return;
    const read = () => {
      const v = (n: string) => (form.elements.namedItem(n) as HTMLSelectElement | null)?.value ?? "";
      setRoute(routeGuide(v("pickupPlaceId"), v("dropoffPlaceId")));
    };
    read();
    form.addEventListener("change", read);
    return () => form.removeEventListener("change", read);
  }, []);

  return (
    <p ref={el} className="price-note route-guide" aria-live="polite" hidden={!route}>
      {route && (
        <>
          <strong>{text.line.replace("{km}", String(route.km)).replace("{time}", fmtMinutes(route.minutes)).replace("{low}", String(route.lowEur)).replace("{high}", String(route.highEur))}</strong>{" "}
          {text.hint}
        </>
      )}
    </p>
  );
}
