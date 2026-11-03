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

type DirectoryEntry = {
  id: string;
  name: string;
  city: string;
  trips: number;
  transportProfile: { vehicleCategories: VehicleCategory[]; fleetSize: number | null } | null;
};

/** Auswahl geprüfter Beförderungsunternehmen für gezielte Anfragen. Bisherige Partner stehen oben. */
export async function ProviderPicker({ providers, selected = [], name = "invitedOrgIds" }: { providers: DirectoryEntry[]; selected?: string[]; name?: string }) {
  const { t } = await getI18n();
  if (providers.length === 0) return <p className="picker-empty">{t("Derzeit keine weiteren geprüften Unternehmen.")}</p>;
  return (
    <div className="picker">
      {providers.map((p) => {
        const cats = p.transportProfile?.vehicleCategories ?? [];
        const details = [
          p.city,
          p.transportProfile?.fleetSize ? t("{n} Fahrzeuge", { n: p.transportProfile.fleetSize }) : null,
          cats.length ? cats.slice(0, 3).map((c) => t(VEHICLE_LABEL[c])).join(", ") : null,
        ].filter(Boolean).join(" · ");
        return (
          <label key={p.id}>
            <input type="checkbox" name={name} value={p.id} defaultChecked={selected.includes(p.id)} />
            <span>
              {p.name}
              <span className="price-note">{details}</span>
              {p.trips > 0 && <span className="price-note">{t(p.trips === 1 ? "1 Fahrt mit Ihnen" : "{n} Fahrten mit Ihnen", { n: p.trips })}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
