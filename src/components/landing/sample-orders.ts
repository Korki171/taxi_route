// Beispieldaten für die Landing Page. Bewusst fiktiv und als Beispiel gekennzeichnet:
// echte Aufträge sind nur für angemeldete, berechtigte Organisationen sichtbar.

export type SampleOrder = {
  id: string;
  day: string;
  time: string;
  from: string;
  to: string;
  pax: number;
  luggage: string;
  vehicle: string;
  price: number;
  priceKind: "Festpreis" | "Richtpreis";
  note?: string;
};

export const SAMPLE_ORDERS: SampleOrder[] = [
  { id: "TR-2611-0412", day: "Fr 14.11.", time: "05:40", from: "Innsbruck", to: "Flughafen München", pax: 3, luggage: "4 Koffer, 2 Ski", vehicle: "Van", price: 245, priceKind: "Festpreis", note: "Abflug LH 2471 um 08:35" },
  { id: "TR-2611-0415", day: "Fr 14.11.", time: "09:15", from: "Flughafen München", to: "Innsbruck", pax: 2, luggage: "2 Koffer", vehicle: "Limousine", price: 220, priceKind: "Richtpreis", note: "Ankunft 08:50, Terminal 2" },
  { id: "TR-2611-0419", day: "Fr 14.11.", time: "11:30", from: "Flughafen München", to: "Hall in Tirol", pax: 4, luggage: "5 Koffer", vehicle: "Van", price: 235, priceKind: "Festpreis" },
  { id: "TR-2611-0421", day: "Sa 15.11.", time: "11:00", from: "Flughafen München", to: "Kitzbühel", pax: 6, luggage: "6 Koffer, 4 Ski", vehicle: "Kleinbus", price: 310, priceKind: "Festpreis" },
  { id: "TR-2611-0426", day: "Sa 15.11.", time: "13:30", from: "Flughafen München", to: "Mayrhofen", pax: 4, luggage: "4 Koffer", vehicle: "Van", price: 290, priceKind: "Richtpreis" },
  { id: "TR-2611-0430", day: "So 16.11.", time: "06:10", from: "Seefeld", to: "Flughafen München", pax: 1, luggage: "1 Koffer", vehicle: "Limousine", price: 230, priceKind: "Festpreis" },
  { id: "TR-2611-0433", day: "So 16.11.", time: "16:45", from: "Flughafen München", to: "Kufstein", pax: 2, luggage: "3 Koffer", vehicle: "Limousine", price: 165, priceKind: "Richtpreis" },
];

export const EXAMPLE_QUERIES = [
  "Flughafen München → Tirol",
  "Flughafen München → Innsbruck",
  "Innsbruck → Flughafen München",
];

const TYROL = ["innsbruck", "hall in tirol", "kitzbühel", "mayrhofen", "seefeld", "kufstein", "schwaz", "sölden", "st. anton"];

const ALIASES: Record<string, string> = {
  muc: "flughafen münchen",
  münchen: "flughafen münchen",
  muenchen: "flughafen münchen",
  flughafen: "flughafen münchen",
  "flughafen muenchen": "flughafen münchen",
  "munich airport": "flughafen münchen",
  munich: "flughafen münchen",
  airport: "flughafen münchen",
  tyrol: "tirol",
  ibk: "innsbruck",
  hall: "hall in tirol",
  kitz: "kitzbühel",
  kitzbuehel: "kitzbühel",
};

function norm(s: string) {
  const t = s.trim().toLowerCase().replace(/\s+/g, " ");
  return ALIASES[t] ?? t;
}

/** "A → B", "A nach B", "A - B" oder nur ein Ort. */
export function matchOrders(query: string): SampleOrder[] {
  const parts = query.split(/→|->|\bnach\b|\bto\b|–| - /i).map(norm).filter(Boolean);
  if (parts.length === 0) return [];
  const hit = (place: string, q: string) => {
    const p = place.toLowerCase();
    if (q === "tirol") return TYROL.includes(p);
    return p.includes(q) || q.includes(p);
  };
  if (parts.length === 1) {
    return SAMPLE_ORDERS.filter((o) => hit(o.from, parts[0]) || hit(o.to, parts[0]));
  }
  const [from, to] = parts;
  return SAMPLE_ORDERS.filter((o) => hit(o.from, from) && hit(o.to, to));
}
