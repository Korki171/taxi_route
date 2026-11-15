import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { sentEmails } from "@/server/email";
import { sentPushes } from "@/server/push";
import { blockOrg } from "@/server/services/partners";
import { createTransferRequest, takeFixedPriceRequest } from "@/server/services/marketplace";
import { removePushSubscription, savePushSubscription } from "@/server/services/push";
import { addMember, requestInput, verifiedTaxi } from "./helpers";

const sub = (n: number) => ({ endpoint: `https://fcm.googleapis.com/fcm/send/${n}`, keys: { p256dh: "p".repeat(40), auth: "a".repeat(20) } });

beforeEach(() => {
  sentPushes.length = 0;
  sentEmails.length = 0;
});

describe("Mitteilungen aufs Gerät", () => {
  it("gesperrte Unternehmen bekommen keine Mitteilung über neue Aufträge", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const blocked = await verifiedTaxi("Taxi Gesperrt");
    await savePushSubscription(blocked.actor, null, sub(1));
    await blockOrg(poster.actor, blocked.org.id);
    await createTransferRequest(poster.actor, requestInput({ priceMode: "FIXED" }));
    expect(sentPushes).toHaveLength(0);
  });

  it("neuer Festpreis-Auftrag: Mitteilung mit „Übernehmen“ an die Geräte der anderen Betriebe", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const taker = await verifiedTaxi("Taxi Nehmer");
    await savePushSubscription(taker.actor, null, sub(1));
    await savePushSubscription(poster.actor, null, sub(2));

    const req = await createTransferRequest(poster.actor, requestInput({ priceMode: "FIXED" }));
    expect(sentPushes).toHaveLength(1);
    const p = sentPushes[0];
    expect(p.userId).toBe(taker.user.id);
    expect(p.message.takeRequestId).toBe(req.id);
    expect(p.message.actions?.map((a) => a.action)).toEqual(["take", "open"]);
    expect(p.message.url).toBe(`/boerse/auftrag/${req.id}`);
    expect(p.message.body).toContain("Festpreis");

    // Übernahme: beide Seiten erfahren es, ohne Übernehmen-Knopf
    sentPushes.length = 0;
    await takeFixedPriceRequest(taker.actor, req.id);
    expect(sentPushes.map((x) => x.userId).sort()).toEqual([poster.user.id, taker.user.id].sort());
    expect(sentPushes.every((x) => !x.message.takeRequestId)).toBe(true);
  });

  it("Mitteilung auch ohne E-Mail-Wunsch; Fahrer erhalten keine", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const taker = await verifiedTaxi("Taxi Nehmer");
    await db.organization.update({ where: { id: taker.org.id }, data: { mailNewJobs: false } });
    const driver = await addMember(taker.org.id, "DRIVER");
    await savePushSubscription(taker.actor, null, sub(1));
    await savePushSubscription(driver.actor, null, sub(2));

    await createTransferRequest(poster.actor, requestInput());
    expect(sentPushes.map((x) => x.userId)).toEqual([taker.user.id]);
    expect(sentEmails.filter((m) => m.to === taker.org.email)).toEqual([]);
  });

  it("verhandelbarer Auftrag: Mitteilung ohne Übernehmen-Knopf", async () => {
    const poster = await verifiedTaxi("Taxi Abgeber");
    const taker = await verifiedTaxi("Taxi Nehmer");
    await savePushSubscription(taker.actor, null, sub(1));
    await createTransferRequest(poster.actor, requestInput());
    expect(sentPushes).toHaveLength(1);
    expect(sentPushes[0].message.takeRequestId).toBeUndefined();
  });

  it("Gerät einschalten ist wiederholbar, ausschalten entfernt es; Abmelden schaltet ab", async () => {
    const taxi = await verifiedTaxi();
    const session = await db.session.create({ data: { id: "s1", userId: taxi.user.id, activeOrgId: taxi.org.id, expiresAt: new Date(Date.now() + 60_000) } });
    await savePushSubscription(taxi.actor, session.id, sub(1));
    await savePushSubscription(taxi.actor, session.id, sub(1));
    await savePushSubscription(taxi.actor, null, sub(2));
    expect(await db.pushSubscription.count()).toBe(2);
    await removePushSubscription(taxi.actor, sub(2).endpoint);
    expect(await db.pushSubscription.count()).toBe(1);
    await db.session.delete({ where: { id: session.id } });
    expect(await db.pushSubscription.count()).toBe(0);
    await expect(savePushSubscription(taxi.actor, null, { endpoint: "http://unsicher.example.com", keys: sub(1).keys })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(savePushSubscription(null, null, sub(3))).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("nimmt nur echte Push-Dienste an und hängt fremde Geräte nicht um", async () => {
    const a = await verifiedTaxi();
    const b = await verifiedTaxi();
    await expect(savePushSubscription(a.actor, null, { endpoint: "https://intern.example.com/x", keys: sub(1).keys })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(savePushSubscription(a.actor, null, { endpoint: "https://fcm.googleapis.com.evil.com/x", keys: sub(1).keys })).rejects.toMatchObject({ code: "VALIDATION" });
    await savePushSubscription(a.actor, null, sub(7));
    await savePushSubscription(b.actor, null, sub(7));
    expect((await db.pushSubscription.findUniqueOrThrow({ where: { endpoint: sub(7).endpoint } })).userId).toBe(a.user.id);
  });
});
