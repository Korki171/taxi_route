/**
 * Ortskatalog für den Startmarkt Tirol ↔ Flughafen München. Strukturierte Orte statt Freitext,
 * damit Filter und Rückfahrt-Matching zuverlässig funktionieren. Die genaue Abholadresse
 * steht separat am Auftrag und ist nur für Beteiligte sichtbar.
 */
export type Place = {
  id: string;
  name: string;
  /// ISO-3166-2-nahe Region, z. B. AT-7 = Tirol
  region: string;
  country: "AT" | "DE" | "IT" | "CH";
  lat: number;
  lng: number;
  airport?: boolean;
};

export const REGION_LABEL: Record<string, string> = {
  "AT-7": "Tirol",
  "AT-5": "Salzburg",
  "DE-BY": "Bayern",
  "IT-32": "Südtirol",
  "CH-ZH": "Zürich",
};

export const PLACES: Place[] = [
  { id: "muc", name: "Flughafen München", region: "DE-BY", country: "DE", lat: 48.3538, lng: 11.7861, airport: true },
  { id: "inn", name: "Flughafen Innsbruck", region: "AT-7", country: "AT", lat: 47.2602, lng: 11.3439, airport: true },
  { id: "szg", name: "Flughafen Salzburg", region: "AT-5", country: "AT", lat: 47.7933, lng: 13.0043, airport: true },
  { id: "zrh", name: "Flughafen Zürich", region: "CH-ZH", country: "CH", lat: 47.4581, lng: 8.5555, airport: true },
  { id: "innsbruck", name: "Innsbruck", region: "AT-7", country: "AT", lat: 47.2692, lng: 11.4041 },
  { id: "hall", name: "Hall in Tirol", region: "AT-7", country: "AT", lat: 47.2833, lng: 11.5079 },
  { id: "schwaz", name: "Schwaz", region: "AT-7", country: "AT", lat: 47.35, lng: 11.7 },
  { id: "woergl", name: "Wörgl", region: "AT-7", country: "AT", lat: 47.4894, lng: 12.0611 },
  { id: "kufstein", name: "Kufstein", region: "AT-7", country: "AT", lat: 47.5833, lng: 12.1667 },
  { id: "kitzbuehel", name: "Kitzbühel", region: "AT-7", country: "AT", lat: 47.4467, lng: 12.3922 },
  { id: "seefeld", name: "Seefeld in Tirol", region: "AT-7", country: "AT", lat: 47.3297, lng: 11.1878 },
  { id: "mayrhofen", name: "Mayrhofen", region: "AT-7", country: "AT", lat: 47.1667, lng: 11.8667 },
  { id: "zell-ziller", name: "Zell am Ziller", region: "AT-7", country: "AT", lat: 47.2333, lng: 11.8833 },
  { id: "soelden", name: "Sölden", region: "AT-7", country: "AT", lat: 46.9653, lng: 11.0076 },
  { id: "st-anton", name: "St. Anton am Arlberg", region: "AT-7", country: "AT", lat: 47.1297, lng: 10.2683 },
  { id: "ischgl", name: "Ischgl", region: "AT-7", country: "AT", lat: 46.969, lng: 10.293 },
  { id: "muenchen", name: "München Stadt", region: "DE-BY", country: "DE", lat: 48.1372, lng: 11.5756 },
  { id: "rosenheim", name: "Rosenheim", region: "DE-BY", country: "DE", lat: 47.8561, lng: 12.1289 },
  { id: "salzburg", name: "Salzburg Stadt", region: "AT-5", country: "AT", lat: 47.8095, lng: 13.055 },
  { id: "bozen", name: "Bozen", region: "IT-32", country: "IT", lat: 46.4983, lng: 11.3548 },
];

const BY_ID = new Map(PLACES.map((p) => [p.id, p]));

export function getPlace(id: string): Place | undefined {
  return BY_ID.get(id);
}

export function placeName(id: string): string {
  return BY_ID.get(id)?.name ?? id;
}

export function isPlaceId(id: string): boolean {
  return BY_ID.has(id);
}

export const ROAD_FACTOR = 1.3; // Luftlinie → Straße (Alpentäler)
const AVG_KMH = 85;

type Point = { lat: number; lng: number };

/** Luftlinie in Kilometern. */
export function haversineKm(a: Point, b: Point) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Geschätzte Fahrzeit in Minuten. Bewusst eine Näherung (Luftlinie × Straßenfaktor),
 * bis ein Routingdienst angebunden ist. Wird in der Oberfläche als Schätzung angezeigt.
 */
export function estimateMinutes(fromId: string, toId: string): number {
  const a = BY_ID.get(fromId);
  const b = BY_ID.get(toId);
  if (!a || !b || a.id === b.id) return 0;
  return Math.round(((haversineKm(a, b) * ROAD_FACTOR) / AVG_KMH) * 60);
}

/** Nächstgelegener Ort aus dem Katalog, z. B. um eine GPS-Position grob zu benennen. */
export function nearestPlace(p: Point): Place {
  let best = PLACES[0];
  let dist = Infinity;
  for (const c of PLACES) {
    const d = haversineKm(p, c);
    if (d < dist) [best, dist] = [c, d];
  }
  return best;
}
