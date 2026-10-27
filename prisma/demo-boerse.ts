/**
 * Beispieldaten für die Auftragsbörse (nur lokal / Demo, niemals in Produktion).
 *
 *   npm run db:demo
 *
 * Legt fünf Demo-Unternehmen an (Namen mit „Demo“, E-Mails auf demo.test), schaltet ihre
 * Funktionen direkt als geprüft frei (die echte Prüfung läuft über den Admin-Bereich)
 * und spielt Aufträge, Angebote, Buchungen und freie Fahrten über die echten Services ein.
 * Alle Demo-Konten nutzen das Passwort „demo-passwort-123“. Das Skript ist wiederholbar:
 * vorhandene Demo-Unternehmen werden vorher entfernt.
 */
import type { OrganizationType } from "@prisma/client";
import { db } from "../src/lib/db";
import { fromLocalInput } from "../src/lib/format";
import { loadActor, type OrgActor } from "../src/server/authz/context";
import { hashPassword } from "../src/server/auth/password";
import { assignBooking } from "../src/server/services/dispatch";
import { advanceTrip, recordPositions } from "../src/server/services/driver";
import { createVehicle, publishCapacity, setCapacityStatus } from "../src/server/services/fleet";
import {
  acceptQuote,
  cancelBooking,
  completeTrip,
  createTransferRequest,
  startTrip,
  submitQuote,
  takeFixedPriceRequest,
} from "../src/server/services/marketplace";
import { registerOrganization } from "../src/server/services/registration";

const PASSWORD = "demo-passwort-123";

/** Ortszeit Wien: Tage ab heute und Uhrzeit. */
function at(days: number, time: string) {
  const d = new Date(Date.now() + days * 86_400_000);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(d);
  return fromLocalInput(`${date}T${time}`)!.toISOString();
}

async function org(type: OrganizationType, name: string, person: string, email: string, city: string, postalCode: string) {
  const { user, organization } = await registerOrganization({
    user: { name: person, email, password: PASSWORD },
    organization: { type, name, street: "Demostraße 1", postalCode, city, country: "AT", email, phone: "+43 512 000 000" },
  });
  const caps = type === "TRANSPORT_COMPANY" ? (["TRANSPORT_PROVIDER", "TRANSFER_BOOKER"] as const) : (["TRANSFER_BOOKER"] as const);
  for (const capability of caps) {
    await db.organizationCapability.upsert({
      where: { organizationId_capability: { organizationId: organization.id, capability } },
      create: { organizationId: organization.id, capability, status: "VERIFIED", reviewNote: "Demo: ohne Prüfung freigeschaltet" },
      update: { status: "VERIFIED", reviewNote: "Demo: ohne Prüfung freigeschaltet" },
    });
  }
  if (type === "TRANSPORT_COMPANY") {
    await db.transportProfile.update({
      where: { organizationId: organization.id },
      data: { fleetSize: 6, vehicleCategories: ["SEDAN", "MINIVAN", "VAN"], declaredRegions: ["Tirol", "Oberbayern"] },
    });
  }
  return (await loadActor(user.id, organization.id)) as OrgActor;
}

async function main() {
  const old = await db.organization.findMany({ where: { email: { endsWith: "@demo.test" } }, select: { id: true } });
  if (old.length) {
    const ids = old.map((o) => o.id);
    await db.booking.deleteMany({ where: { OR: [{ providerOrgId: { in: ids } }, { requesterOrgId: { in: ids } }] } });
    await db.quote.deleteMany({ where: { providerOrgId: { in: ids } } });
    await db.organization.deleteMany({ where: { id: { in: ids } } });
  }
  await db.user.deleteMany({ where: { email: { endsWith: "@demo.test" } } });

  const alpen = await org("TRANSPORT_COMPANY", "Demo Alpen Taxi Innsbruck", "Lukas Pichler", "taxi@demo.test", "Innsbruck", "6020");
  const ziller = await org("TRANSPORT_COMPANY", "Demo Zillertal Transfer", "Anna Eberharter", "ziller@demo.test", "Mayrhofen", "6290");
  const kitzLimo = await org("TRANSPORT_COMPANY", "Demo Kitz Limousinen", "Markus Hechenberger", "limo@demo.test", "Kitzbühel", "6370");
  const reise = await org("TRAVEL_AGENCY", "Demo Reisebüro Kitzbühel", "Sabine Krimbacher", "reise@demo.test", "Kitzbühel", "6370");
  const oetztal = await org("TRAVEL_AGENCY", "Demo Ötztal Reisen", "Thomas Gstrein", "oetztal@demo.test", "Sölden", "6450");

  const vClass = await createVehicle(alpen, { label: "Mercedes V-Klasse 1", category: "MINIVAN", licensePlate: "I-AT 101", seats: 6, luggage: 6, skiCapacity: 6 });
  const superb = await createVehicle(alpen, { label: "Škoda Superb Kombi", category: "ESTATE", licensePlate: "I-AT 102", seats: 4, luggage: 4, skiCapacity: 4 });
  const caravelle = await createVehicle(alpen, { label: "VW Caravelle", category: "VAN", licensePlate: "I-AT 103", seats: 8, luggage: 8, skiCapacity: 8 });
  const sprinter = await createVehicle(ziller, { label: "Sprinter 8+1", category: "VAN", seats: 8, luggage: 10, skiCapacity: 8 });

  const terms = { bookingTerms: "Wartezeit am Flughafen bis 60 Minuten nach Landung inklusive", cancellationTerms: "Kostenlos bis 24 Stunden vor Abholung" };

  // Reisebüro → Taxi (Szenario B)
  const r1 = await createTransferRequest(reise, {
    pickupPlaceId: "muc", dropoffPlaceId: "kitzbuehel", pickupAddress: "Terminal 2, Ankunft Ebene 04", dropoffAddress: "Hotel Weisses Rössl, Bichlstraße 5",
    pickupAt: at(1, "14:30"), pickupWindowMinutes: 15, passengers: 4, luggage: 6, skiEquipment: 4, vehicleCategory: "MINIVAN",
    flightNumber: "LH 2154", flightArrivalAt: at(1, "14:05"), pickupNotes: "Namensschild „Familie Berger“", priceMode: "NEGOTIABLE", priceCents: 29000,
    clientReference: "RB-2026-118", passengerName: "Familie Berger", passengerPhone: "+43 660 111 2233", ...terms,
  });
  await submitQuote(ziller, r1.id, { amountCents: 31000, vehicleCategory: "VAN", message: "Sprinter mit Skibox, Fahrer spricht Englisch" });
  await submitQuote(kitzLimo, r1.id, { amountCents: 28500, vehicleCategory: "MINIVAN", message: "V-Klasse, Kindersitz auf Wunsch kostenlos" });

  await createTransferRequest(reise, {
    pickupPlaceId: "kitzbuehel", dropoffPlaceId: "muc", pickupAt: at(3, "06:00"), passengers: 2, luggage: 3,
    flightNumber: "LH 1702", priceMode: "FIXED", priceCents: 26000, clientReference: "RB-2026-121", passengerName: "Dr. Huber", ...terms,
  });
  await createTransferRequest(reise, {
    pickupPlaceId: "muc", dropoffPlaceId: "seefeld", pickupAt: at(2, "11:15"), passengers: 7, luggage: 9, skiEquipment: 7,
    vehicleCategory: "VAN", priceMode: "NEGOTIABLE", priceCents: 38000, quoteDeadline: at(1, "18:00"), passengerName: "Skiclub Gröbenzell", ...terms,
  });
  const r4 = await createTransferRequest(reise, {
    pickupPlaceId: "muc", dropoffPlaceId: "innsbruck", pickupAt: at(1, "18:40"), passengers: 2, luggage: 2,
    flightNumber: "EW 7015", priceMode: "NEGOTIABLE", priceCents: 19000, passengerName: "Hr. Lindner", ...terms,
  });
  await submitQuote(ziller, r4.id, { amountCents: 21000, vehicleCategory: "SEDAN" });

  await createTransferRequest(oetztal, {
    pickupPlaceId: "muc", dropoffPlaceId: "soelden", pickupAt: at(1, "16:00"), passengers: 3, luggage: 5, skiEquipment: 3,
    priceMode: "FIXED", priceCents: 34000, flightNumber: "LH 1987", passengerName: "Familie Jansen", ...terms,
  });
  await createTransferRequest(oetztal, {
    pickupPlaceId: "inn", dropoffPlaceId: "soelden", pickupAt: at(4, "10:30"), passengers: 2, luggage: 2,
    priceMode: "FIXED", priceCents: 12000, passengerName: "Paar Svensson", ...terms,
  });

  // Taxi → Taxi (Szenario A): Zillertal gibt Spitzen ab
  await createTransferRequest(ziller, {
    pickupPlaceId: "muc", dropoffPlaceId: "mayrhofen", pickupAt: at(1, "11:00"), passengers: 8, luggage: 10, skiEquipment: 8,
    vehicleCategory: "MINIBUS", priceMode: "NEGOTIABLE", priceCents: 42000, requirements: "Anhänger für Skiausrüstung", passengerName: "Gruppe Utrecht",
  });
  await createTransferRequest(ziller, {
    pickupPlaceId: "mayrhofen", dropoffPlaceId: "muc", pickupAt: at(2, "05:30"), passengers: 3, luggage: 4,
    priceMode: "FIXED", priceCents: 30000, flightNumber: "KL 1796", passengerName: "Hr. de Vries",
  });
  await createTransferRequest(kitzLimo, {
    pickupPlaceId: "szg", dropoffPlaceId: "kitzbuehel", pickupAt: at(2, "13:20"), passengers: 2, luggage: 3,
    vehicleCategory: "LUXURY", priceMode: "FIXED", priceCents: 28000, passengerName: "Mrs. Whitfield",
  });
  await createTransferRequest(kitzLimo, {
    pickupPlaceId: "muc", dropoffPlaceId: "hall", pickupAt: at(1, "19:30"), passengers: 2, luggage: 2,
    priceMode: "FIXED", priceCents: 21000, passengerName: "Fr. Moser",
  });

  // Eigener Auftrag von Alpen Taxi mit eingegangenen Angeboten
  const own = await createTransferRequest(alpen, {
    pickupPlaceId: "innsbruck", dropoffPlaceId: "zrh", pickupAddress: "Museumstraße 5, 6020 Innsbruck", pickupAt: at(5, "07:00"),
    passengers: 5, luggage: 6, vehicleCategory: "MINIVAN", priceMode: "NEGOTIABLE", priceCents: 52000, clientReference: "AT-5512",
    passengerName: "Firma Swarovski Delegation", ...terms,
  });
  await submitQuote(ziller, own.id, { amountCents: 54000, vehicleCategory: "VAN", message: "Fahrt über Arlberg, Ankunft ca. 11:00" });
  await submitQuote(kitzLimo, own.id, { amountCents: 49500, vehicleCategory: "MINIVAN", message: "Rückfahrt ab Zürich ohnehin geplant" });

  // Verbindliche Buchungen von Alpen Taxi
  const b1 = await createTransferRequest(reise, {
    pickupPlaceId: "muc", dropoffPlaceId: "st-anton", pickupAddress: "Terminal 1, Modul C", dropoffAddress: "Hotel Post, St. Anton",
    pickupAt: at(2, "15:45"), passengers: 4, luggage: 5, skiEquipment: 4, priceMode: "NEGOTIABLE", priceCents: 39000,
    flightNumber: "BA 948", passengerName: "Familie Clarke", passengerPhone: "+44 7700 900123", clientReference: "RB-2026-109", ...terms,
  });
  const q = await submitQuote(alpen, b1.id, { amountCents: 37500, vehicleCategory: "MINIVAN", message: "V-Klasse mit Skiträger" });
  await submitQuote(ziller, b1.id, { amountCents: 41000, vehicleCategory: "VAN" });
  await acceptQuote(reise, q.id);

  const b2 = await createTransferRequest(oetztal, {
    pickupPlaceId: "soelden", dropoffPlaceId: "muc", pickupAddress: "Hotel Central, Sölden", pickupAt: at(3, "09:00"),
    passengers: 2, luggage: 3, priceMode: "FIXED", priceCents: 36000, passengerName: "Familie Novak", ...terms,
  });
  await takeFixedPriceRequest(alpen, b2.id, { vehicleId: vClass.id });

  // Abgeschlossen und storniert (Abholzeit nachträglich in die Vergangenheit gelegt)
  const done = await createTransferRequest(reise, {
    pickupPlaceId: "kitzbuehel", dropoffPlaceId: "muc", pickupAt: at(1, "08:00"), passengers: 3, luggage: 4,
    priceMode: "FIXED", priceCents: 25000, passengerName: "Fr. Weber", ...terms,
  });
  const doneBooking = await takeFixedPriceRequest(alpen, done.id, { vehicleId: vClass.id });
  await startTrip(alpen, doneBooking.id);
  await completeTrip(alpen, doneBooking.id, "Pünktlich übergeben, Terminal 2");
  await db.transferRequest.update({ where: { id: done.id }, data: { pickupAt: new Date(Date.now() - 2 * 86_400_000) } });

  const cancelled = await createTransferRequest(oetztal, {
    pickupPlaceId: "inn", dropoffPlaceId: "soelden", pickupAt: at(6, "12:00"), passengers: 1, luggage: 1,
    priceMode: "FIXED", priceCents: 11000, passengerName: "Hr. Kowalski", ...terms,
  });
  const cBooking = await takeFixedPriceRequest(alpen, cancelled.id);
  await cancelBooking(oetztal, cBooking.id, "Gast hat die Reise abgesagt");

  // Freie Fahrten (Szenario C): Rückfahrt MUC → Innsbruck nach der Abgabe am Flughafen
  const back = await publishCapacity(alpen, {
    vehicleId: vClass.id, fromPlaceId: "muc", toPlaceId: "innsbruck", availableFrom: at(1, "17:30"), availableUntil: at(1, "21:30"),
    maxDetourMinutes: 25, maxWaitMinutes: 90, note: "Leer zurück nach Gästeabgabe am Terminal 2",
  });
  await setCapacityStatus(alpen, back.id, "CONFIRMED");
  await publishCapacity(alpen, {
    vehicleId: vClass.id, fromPlaceId: "innsbruck", toPlaceId: "muc", availableFrom: at(3, "04:00"), availableUntil: at(3, "08:00"),
    maxDetourMinutes: 20, maxWaitMinutes: 60, note: "Noch nicht fix, hängt von der Frühschicht ab",
  });
  await publishCapacity(ziller, {
    vehicleId: sprinter.id, fromPlaceId: "muc", toPlaceId: "mayrhofen", availableFrom: at(2, "08:00"), availableUntil: at(2, "12:00"),
    maxDetourMinutes: 30, maxWaitMinutes: 120,
  });

  await liveFleetDemo(alpen, reise, { vClass: vClass.id, superb: superb.id, caravelle: caravelle.id }, terms);

  console.log("Beispieldaten eingespielt. Anmeldung z. B. mit taxi@demo.test, reise@demo.test oder fahrer@demo.test, Passwort", PASSWORD);
}

async function driver(company: OrgActor, name: string, email: string) {
  const user = await db.user.create({ data: { name, email, passwordHash: await hashPassword(PASSWORD) } });
  await db.membership.create({ data: { userId: user.id, organizationId: company.org.id, role: "DRIVER", trackingConsentAt: new Date() } });
  return (await loadActor(user.id, company.org.id)) as OrgActor;
}

/** Positionen der letzten Minuten entlang einer Strecke, die bei `to` endet. */
function trail(points: [number, number][], minutes: number, speed = 25) {
  const n = minutes * 2;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * (points.length - 1);
    const k = Math.min(Math.floor(x), points.length - 2);
    const f = x - k;
    const [a, b] = [points[k], points[k + 1]];
    const heading = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    out.push({ lat: a[0] + (b[0] - a[0]) * f, lng: a[1] + (b[1] - a[1]) * f, accuracy: 6, speed, heading: (heading + 360) % 360, at: Date.now() - (n - i) * 30_000 });
  }
  return out;
}

/** Live-Karte: drei Fahrer von Alpen Taxi in der Schicht, mit laufenden und anstehenden Fahrten. */
async function liveFleetDemo(alpen: OrgActor, reise: OrgActor, v: { vClass: string; superb: string; caravelle: string }, terms: Record<string, string>) {
  const stefan = await driver(alpen, "Stefan Mair", "fahrer@demo.test");
  const martina = await driver(alpen, "Martina Kofler", "fahrer2@demo.test");
  const ali = await driver(alpen, "Ali Yilmaz", "fahrer3@demo.test");

  const soon = (min: number) => new Date(Date.now() + min * 60_000).toISOString();
  const book = async (input: Record<string, unknown>) => {
    const r = await createTransferRequest(reise, { priceMode: "FIXED", ...terms, ...input });
    return takeFixedPriceRequest(alpen, r.id);
  };
  // Läuft: Fahrgast an Bord Richtung Flughafen München
  const onBoard = await book({
    pickupPlaceId: "innsbruck", dropoffPlaceId: "muc", pickupAddress: "Hotel Grauer Bär, Universitätsstraße 5", dropoffAddress: "Terminal 2, Abflug",
    pickupAt: soon(5), passengers: 3, luggage: 4, priceCents: 24000, flightNumber: "LH 2471", passengerName: "Familie Steiner", passengerPhone: "+43 660 555 1234",
  });
  // Auf dem Weg zur Abholung in Seefeld
  const toPickup = await book({
    pickupPlaceId: "seefeld", dropoffPlaceId: "inn", pickupAddress: "Hotel Klosterbräu, Klosterstraße 30", pickupAt: soon(35),
    passengers: 2, luggage: 2, priceCents: 9000, flightNumber: "EW 2015", passengerName: "Hr. und Fr. Schulz",
  });
  // Später heute: Ali (frei am Flughafen) und eine noch nicht zugewiesene Fahrt
  const later = await book({
    pickupPlaceId: "inn", dropoffPlaceId: "kitzbuehel", pickupAddress: "Ankunftshalle", pickupAt: soon(150),
    passengers: 4, luggage: 5, skiEquipment: 4, priceCents: 21000, passengerName: "Gruppe Andersson",
  });
  await book({ pickupPlaceId: "innsbruck", dropoffPlaceId: "muc", pickupAt: soon(300), passengers: 2, luggage: 2, priceCents: 23500, passengerName: "Fr. Lechner" });

  await assignBooking(alpen, onBoard.id, { driverId: stefan.userId, vehicleId: v.vClass });
  await assignBooking(alpen, toPickup.id, { driverId: martina.userId, vehicleId: v.superb });
  await assignBooking(alpen, later.id, { driverId: ali.userId, vehicleId: v.caravelle });

  const shifts: [OrgActor, string, [number, number][], number, number?][] = [
    // Inntalautobahn Richtung Kufstein
    [stefan, v.vClass, [[47.2692, 11.4041], [47.2833, 11.5079], [47.35, 11.71], [47.43, 11.86], [47.48, 11.96]], 25],
    // Innsbruck → Zirl → Seefeld
    [martina, v.superb, [[47.2692, 11.4041], [47.27, 11.30], [47.2735, 11.2418], [47.30, 11.215]], 12],
    // Wartet am Flughafen Innsbruck
    [ali, v.caravelle, [[47.2598, 11.3452], [47.2602, 11.3439]], 6, 0],
  ];
  for (const [actor, vehicleId, route, minutes, speed] of shifts) {
    await db.driverShift.create({ data: { organizationId: alpen.org.id, userId: actor.userId, vehicleId, startedAt: new Date(Date.now() - 4 * 3600_000) } });
    await recordPositions(actor, trail(route, minutes, speed));
  }
  await advanceTrip(stefan, onBoard.id, "ON_BOARD");
  await db.transferRequest.update({ where: { id: onBoard.requestId }, data: { pickupAt: new Date(Date.now() - 30 * 60_000) } });
  await advanceTrip(martina, toPickup.id, "TO_PICKUP");
  // Etappen begannen mit der ersten Position der Spur (für Start-Schild und Fortschritt)
  await db.booking.update({ where: { id: onBoard.id }, data: { tripStageAt: new Date(Date.now() - 26 * 60_000) } });
  await db.booking.update({ where: { id: toPickup.id }, data: { tripStageAt: new Date(Date.now() - 13 * 60_000) } });
}

main().finally(() => db.$disconnect());
