/**
 * Brücke zur nativen Fahrer-App (Capacitor-Hülle um diese Web-App, siehe mobile/README.md).
 * Im Browser gibt es `window.Capacitor` nicht; dann liefern alle Funktionen „nicht nativ“.
 * `@capacitor/core` wird nur in der App nachgeladen.
 */

type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string };

export function nativePlatform(): "ios" | "android" | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: Cap }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return cap.getPlatform?.() === "ios" ? "ios" : "android";
}

type Listener = { remove: () => Promise<void> };

/** Plugin @capacitor-firebase/messaging */
export type Messaging = {
  checkPermissions(): Promise<{ receive: "granted" | "denied" | "prompt" | "prompt-with-rationale" }>;
  requestPermissions(): Promise<{ receive: "granted" | "denied" | "prompt" | "prompt-with-rationale" }>;
  getToken(): Promise<{ token: string }>;
  deleteToken(): Promise<void>;
  addListener(event: "tokenReceived", fn: (e: { token: string }) => void): Promise<Listener>;
  addListener(event: "notificationActionPerformed", fn: (e: { notification?: { data?: Record<string, string> } }) => void): Promise<Listener>;
};

export type NativeLocation = { latitude: number; longitude: number; accuracy: number | null; speed: number | null; bearing: number | null; time: number | null };

/** Plugin @capacitor-community/background-geolocation */
export type BackgroundGeolocation = {
  addWatcher(
    options: { backgroundTitle?: string; backgroundMessage?: string; requestPermissions?: boolean; stale?: boolean; distanceFilter?: number },
    callback: (location?: NativeLocation, error?: { code?: string; message?: string }) => void,
  ): Promise<string>;
  removeWatcher(options: { id: string }): Promise<void>;
};

async function plugin<T>(name: string): Promise<T> {
  const { registerPlugin } = await import("@capacitor/core");
  return registerPlugin<T>(name);
}

/** Eingebautes Capacitor-Plugin für Anfragen über die native Schicht (mit den Cookies der Web-Ansicht) */
export type NativeHttp = { request(options: { url: string; method: string; headers?: Record<string, string>; data?: unknown }): Promise<{ status: number }> };

export const nativeHttp = () => plugin<NativeHttp>("CapacitorHttp");
export const messaging = () => plugin<Messaging>("FirebaseMessaging");
export const backgroundGeolocation = () => plugin<BackgroundGeolocation>("BackgroundGeolocation");

/** Meldet das Geräte-Token der App am Server an. */
export async function saveNativeToken(token: string) {
  const platform = nativePlatform();
  if (!platform) return;
  const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform, token }) });
  if (!res.ok) throw new Error(String(res.status));
}
