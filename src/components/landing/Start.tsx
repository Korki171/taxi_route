"use client";

import Link from "next/link";
import { useId, useState } from "react";

type Labels = { title: string; taxi: string; travel: string; taxiNote: string; travelNote: string; go: string };

/** Der erste Schritt der App, schon offen: wer sind Sie? Die Wahl bestimmt, wohin „Registrieren“ führt. */
export function Start({ L }: { L: Labels }) {
  const [kind, setKind] = useState<"TRANSPORT_COMPANY" | "TRAVEL_AGENCY">("TRANSPORT_COMPANY");
  const name = useId();
  return (
    <form className="hp-start" onSubmit={(e) => e.preventDefault()} aria-labelledby={`${name}-t`} data-ui>
      <p id={`${name}-t`} className="hp-start-title">{L.title}</p>
      <fieldset>
        <legend className="hp-sr">{L.title}</legend>
        <label data-on={kind === "TRANSPORT_COMPANY"}>
          <input type="radio" name={name} checked={kind === "TRANSPORT_COMPANY"} onChange={() => setKind("TRANSPORT_COMPANY")} />
          <span>{L.taxi}</span>
        </label>
        <label data-on={kind === "TRAVEL_AGENCY"}>
          <input type="radio" name={name} checked={kind === "TRAVEL_AGENCY"} onChange={() => setKind("TRAVEL_AGENCY")} />
          <span>{L.travel}</span>
        </label>
      </fieldset>
      <p className="hp-start-note" aria-live="polite">{kind === "TRANSPORT_COMPANY" ? L.taxiNote : L.travelNote}</p>
      <Link href={`/register?type=${kind}`} className="hp-btn hp-start-go">{L.go}</Link>
    </form>
  );
}
