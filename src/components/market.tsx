import Link from "next/link";
import { PLACES, REGION_LABEL, placeName } from "@/lib/places";
import { VEHICLE_LABEL } from "@/lib/labels";
import type { VehicleCategory } from "@prisma/client";
import { getI18n } from "@/server/i18n";

export async function Route({ from, to, href }: { from: string; to: string; href?: string }) {
  const { t } = await getI18n();
  const text = (
    <>
      {t(placeName(from))} <span className="muted">→</span> {t(placeName(to))}
    </>
  );
  return href ? <Link href={href} className="route">{text}</Link> : <span className="route">{text}</span>;
}

export async function PlaceSelect({ name, defaultValue, required, emptyLabel }: { name: string; defaultValue?: string; required?: boolean; emptyLabel?: string }) {
  const { t, f } = await getI18n();
  const regions = [...new Set(PLACES.map((p) => p.region))];
  return (
    <select name={name} defaultValue={defaultValue ?? ""} required={required}>
      <option value="">{emptyLabel ?? t("Bitte wählen")}</option>
      {regions.map((r) => (
        <optgroup key={r} label={t(REGION_LABEL[r] ?? r)}>
          {PLACES.filter((p) => p.region === r).map((p) => (
            <option key={p.id} value={p.id}>{t(p.name)}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export async function VehicleSelect({ name, defaultValue, emptyLabel, required }: { name: string; defaultValue?: string; emptyLabel?: string; required?: boolean }) {
  const { t, f } = await getI18n();
  return (
    <select name={name} defaultValue={defaultValue ?? ""} required={required}>
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {(Object.keys(VEHICLE_LABEL) as VehicleCategory[]).map((v) => (
        <option key={v} value={v}>{t(VEHICLE_LABEL[v])}</option>
      ))}
    </select>
  );
}

export async function Load({ passengers, luggage, ski }: { passengers: number; luggage: number; ski?: number }) {
  const { t } = await getI18n();
  return (
    <span className="nowrap">
      {t("{p} Pers. · {l} Gep.", { p: passengers, l: luggage })}{ski ? ` · ${t("{n} Ski", { n: ski })}` : ""}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}
