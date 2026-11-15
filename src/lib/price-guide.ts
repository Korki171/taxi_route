import { ROAD_FACTOR, estimateMinutes, getPlace, haversineKm } from "./places";

/**
 * Richtwert für den Fahrpreis beim Einstellen. Bewusst eine grobe Schätzung aus der Entfernung
 * (Luftlinie × Straßenfaktor), kein Tarif: zwischen PRICE_PER_KM_LOW und PRICE_PER_KM_HIGH je Kilometer,
 * mindestens MIN_PRICE_EUR. Die Werte stehen nur hier und lassen sich nach den Pilotgesprächen anpassen.
 */
export const PRICE_PER_KM_LOW = 1.4;
export const PRICE_PER_KM_HIGH = 1.8;
export const MIN_PRICE_EUR = 40;

const round5 = (n: number) => Math.round(n / 5) * 5;

export function routeGuide(fromId: string, toId: string): { km: number; minutes: number; lowEur: number; highEur: number } | null {
  const a = getPlace(fromId);
  const b = getPlace(toId);
  if (!a || !b || a.id === b.id) return null;
  const km = Math.round(haversineKm(a, b) * ROAD_FACTOR);
  return {
    km,
    minutes: estimateMinutes(fromId, toId),
    lowEur: Math.max(MIN_PRICE_EUR, round5(km * PRICE_PER_KM_LOW)),
    highEur: Math.max(MIN_PRICE_EUR + 10, round5(km * PRICE_PER_KM_HIGH)),
  };
}
