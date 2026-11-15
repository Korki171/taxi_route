/* Transferborsa: Mitteilungen aufs Gerät. Zeigt die Mitteilung an und übernimmt einen Festpreis-Auftrag
   direkt über den Knopf „Übernehmen“. Kein Zwischenspeichern von Seiten. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (_) {}
  if (!d.title) return;
  event.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body || "",
      tag: d.tag,
      renotify: !!d.tag,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: d,
      actions: d.actions || [],
      requireInteraction: !!d.takeRequestId,
    }),
  );
});

async function openUrl(url) {
  let target = new URL(url || "/boerse", self.location.origin);
  // Nur Seiten dieser App öffnen.
  if (target.origin !== self.location.origin) target = new URL("/boerse", self.location.origin);
  target = target.href;
  const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const w of wins) {
    if ("navigate" in w && "focus" in w) {
      try {
        await w.navigate(target);
        return w.focus();
      } catch (_) {}
    }
  }
  return self.clients.openWindow(target);
}

async function take(d) {
  try {
    const res = await fetch("/api/push/take", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: d.takeRequestId }),
    });
    const r = await res.json();
    if (!r.title) throw new Error("no answer");
    await self.registration.showNotification(r.title, { body: r.body || "", tag: "take:" + d.takeRequestId, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: r.url || d.url } });
  } catch (_) {
    // Kein Netz oder unerwartete Antwort: Auftrag öffnen, dort lässt er sich übernehmen.
    await openUrl(d.url);
  }
}

self.addEventListener("notificationclick", (event) => {
  const d = event.notification.data || {};
  event.notification.close();
  event.waitUntil(event.action === "take" && d.takeRequestId ? take(d) : openUrl(d.url));
});
