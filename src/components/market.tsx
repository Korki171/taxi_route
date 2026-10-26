import Link from "next/link";
import { PLACES, REGION_LABEL, placeName } from "@/lib/places";
import { VEHICLE_LABEL } from "@/lib/labels";
import type { VehicleCategory } from "@prisma/client";

export function Route({ from, to, href }: { from: string; to: string; href?: string }) {
  const text = (
    <>
      {placeName(from)} <span className="muted">→</span> {placeName(to)}
    </>
  );
  return href ? <Link href={href} className="route">{text}</Link> : <span className="route">{text}</span>;
}

export function PlaceSelect({ name, defaultValue, required, emptyLabel }: { name: string; defaultValue?: string; required?: boolean; emptyLabel?: string }) {
  const regions = [...new Set(PLACES.map((p) => p.region))];
  return (
    <select name={name} defaultValue={defaultValue ?? ""} required={required}>
      <option value="">{emptyLabel ?? "Bitte wählen"}</option>
      {regions.map((r) => (
        <optgroup key={r} label={REGION_LABEL[r] ?? r}>
          {PLACES.filter((p) => p.region === r).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function VehicleSelect({ name, defaultValue, emptyLabel, required }: { name: string; defaultValue?: string; emptyLabel?: string; required?: boolean }) {
  return (
    <select name={name} defaultValue={defaultValue ?? ""} required={required}>
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {(Object.keys(VEHICLE_LABEL) as VehicleCategory[]).map((v) => (
        <option key={v} value={v}>{VEHICLE_LABEL[v]}</option>
      ))}
    </select>
  );
}

export function Load({ passengers, luggage, ski }: { passengers: number; luggage: number; ski?: number }) {
  return (
    <span className="nowrap">
      {passengers} Pers. · {luggage} Gep.{ski ? ` · ${ski} Ski` : ""}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}
