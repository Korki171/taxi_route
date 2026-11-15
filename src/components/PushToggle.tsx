"use client";

import { useEffect, useState } from "react";

export type PushText = {
  title: string;
  hint: string;
  enable: string;
  disable: string;
  on: string;
  denied: string;
  iosInstall: string;
  unsupported: string;
  failed: string;
};

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function save(sub: PushSubscription) {
  const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
  if (!res.ok) throw new Error(String(res.status));
}

/**
 * Schaltet Mitteilungen für dieses Gerät ein oder aus. `banner`: kurzer Hinweis, der verschwindet,
 * sobald Mitteilungen laufen oder das Gerät sie nicht kann.
 */
export function PushToggle({ vapidKey, text, banner = false }: { vapidKey: string; text: PushText; banner?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        // iPhone/iPad: Mitteilungen gibt es nur, wenn die Seite auf dem Home-Bildschirm liegt.
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        if (alive) setState(ios ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (alive) setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        // Nach neuer Anmeldung kennt der Server das Gerät evtl. nicht mehr: Eintrag auffrischen.
        if (sub && Notification.permission === "granted") await save(sub);
        if (alive) setState(sub && Notification.permission === "granted" ? "on" : "off");
      } catch {
        if (alive) setState("off");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setError(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey) }));
      await save(sub);
      setState("on");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;
  if (banner && (state === "on" || state === "unsupported" || state === "denied")) return null;

  const message =
    state === "on" ? text.on
    : state === "denied" ? text.denied
    : state === "ios-install" ? text.iosInstall
    : state === "unsupported" ? text.unsupported
    : text.hint;

  return (
    <div className={banner ? "push-banner" : "push-toggle"} role={banner ? "note" : undefined}>
      <div>
        {banner && <strong>{text.title}</strong>}
        <p className={banner ? undefined : "price-note"}>{message}</p>
        {error && <p className="push-error" role="alert">{text.failed}</p>}
      </div>
      {state === "off" && <button type="button" onClick={enable} disabled={busy}>{text.enable}</button>}
      {state === "on" && !banner && <button type="button" className="secondary" onClick={disable} disabled={busy}>{text.disable}</button>}
    </div>
  );
}
