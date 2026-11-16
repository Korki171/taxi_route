import type { PriceMode, VehicleCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { referenceOf } from "./marketplace";

export type SharedRequest = {
  id: string;
  ref: string;
  open: boolean;
  pickupAt: Date;
  pickupPlaceId: string;
  dropoffPlaceId: string;
  passengers: number;
  luggage: number;
  vehicleCategory: VehicleCategory | null;
  priceMode: PriceMode;
  priceCents: number | null;
  handoffSharePercent: number;
  company: string;
};

/**
 * Öffentliche Sicht auf einen Auftrag über den Teilen-Link, ohne Login. Der Auftraggeber verschickt den
 * Link selbst (z. B. in seine WhatsApp-Gruppe). Gezeigt werden Strecke, Zeit, Personen, Fahrzeugwunsch,
 * Preis und der Name des Auftraggebers, aber keine Adressen, Flugdaten oder Fahrgastdaten. Gezielte
 * Anfragen an einzelne Firmen sind nicht teilbar. Übernehmen geht nur angemeldet in der Börse.
 */
export async function sharedRequest(token: string, now = new Date()): Promise<SharedRequest | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const r = await db.transferRequest.findUnique({
    where: { shareToken: token },
    select: {
      id: true, number: true, status: true, visibility: true, pickupAt: true, pickupPlaceId: true, dropoffPlaceId: true,
      passengers: true, luggage: true, vehicleCategory: true, priceMode: true, priceCents: true, handoffSharePercent: true,
      quoteDeadline: true, requesterOrg: { select: { name: true } },
    },
  });
  if (!r || r.visibility !== "MARKET" || r.status === "CANCELLED") return null;
  // Nach der Fahrt gibt es nichts mehr zu zeigen.
  if (r.pickupAt.getTime() + 24 * 3600_000 < now.getTime()) return null;
  return {
    id: r.id,
    ref: referenceOf(r.number),
    open: r.status === "OPEN" && r.pickupAt > now && (!r.quoteDeadline || r.quoteDeadline > now),
    pickupAt: r.pickupAt,
    pickupPlaceId: r.pickupPlaceId,
    dropoffPlaceId: r.dropoffPlaceId,
    passengers: r.passengers,
    luggage: r.luggage,
    vehicleCategory: r.vehicleCategory,
    priceMode: r.priceMode,
    priceCents: r.priceCents,
    handoffSharePercent: r.handoffSharePercent,
    company: r.requesterOrg.name,
  };
}
