import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, validateSessionToken } from "./auth/session";
import { loadActor, type Actor, type OrgActor } from "./authz/context";
import { AppError } from "./errors";

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function getSession() {
  const token = await getSessionToken();
  return token ? validateSessionToken(token) : null;
}

export async function getActor(): Promise<Actor | null> {
  const session = await getSession();
  return session ? loadActor(session.userId, session.activeOrgId) : null;
}

/** Für Seiten: leitet ohne Anmeldung zum Login um. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/login");
  return actor;
}

export async function requireOrgActor(): Promise<OrgActor> {
  const actor = await requireActor();
  if (!actor.org) redirect(actor.isPlatformAdmin ? "/admin" : "/no-organization");
  return actor as OrgActor;
}

/**
 * Führt eine Server-Action aus. Fachliche Fehler werden als Meldung auf die
 * Seite zurückgegeben; unerwartete Fehler werden weitergeworfen.
 */
export async function runAction(backTo: string, fn: () => Promise<void | string>): Promise<never> {
  let next: string;
  try {
    const result = await fn();
    next = result ?? backTo;
  } catch (e) {
    if (e instanceof AppError) {
      if (e.code === "UNAUTHENTICATED") redirect(e.message ? withParam("/login", "error", e.message) : "/login");
      redirect(withParam(backTo, "error", e.message));
    }
    throw e;
  }
  redirect(next);
}

export function withParam(path: string, key: string, value: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${key}=${encodeURIComponent(value)}`;
}

export function formObject(fd: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, (fd.get(k) as string | null) ?? ""]));
}

/** IP-Adresse des Aufrufers (hinter Vercel/Proxy aus X-Forwarded-For). */
export async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
}
