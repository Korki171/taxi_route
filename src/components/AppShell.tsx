import Link from "next/link";
import { db } from "@/lib/db";
import { ORG_TYPE_LABEL, ROLE_LABEL } from "@/lib/labels";
import type { Actor } from "@/server/authz/context";
import { actorCan } from "@/server/authz/context";
import { logoutAction, switchOrgAction } from "@/app/actions";
import { getI18n } from "@/server/i18n";
import { LangSwitch } from "./LangSwitch";
import { ShellNav, type NavItem } from "./ShellNav";

export async function AppShell({ actor, children, narrow, path }: { actor: Actor; children: React.ReactNode; narrow?: boolean; path?: string }) {
  const { t } = await getI18n();
  const memberships = await db.membership.findMany({
    where: { userId: actor.userId },
    select: { organization: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const isDriver = actor.org?.role === "DRIVER";
  const items: NavItem[] = [];
  if (actor.org && !isDriver) items.push({ href: "/dashboard", label: t("Übersicht") });
  if (actorCan(actor, "jobs.accept") || actorCan(actor, "transfers.request")) items.push({ href: "/boerse", label: t("Börse") });
  if (actorCan(actor, "fleet.manage")) items.push({ href: "/flotte/live", label: t("Live-Karte") }, { href: "/flotte", label: t("Flotte") });
  if (isDriver) items.push({ href: "/fahrer", label: t("Meine Fahrten") });
  if (actor.org && !isDriver) items.push({ href: "/organization", label: t("Unternehmen") }, { href: "/organization/members", label: t("Team") });
  if (actorCan(actor, "documents.read")) items.push({ href: "/organization/documents", label: t("Nachweise") });
  if (actor.isPlatformAdmin) items.push({ href: "/admin", label: t("Administration") });

  return (
    <>
      <a href="#main" className="skip">{t("Zum Inhalt springen")}</a>
      <header className="shell">
        <div className="shell-bar">
          <Link href={isDriver ? "/fahrer" : "/dashboard"} className="wordmark">TaxiRoute</Link>
          <ShellNav
            items={items}
            name={actor.name}
            scope={actor.org ? `${actor.org.name} · ${t(ROLE_LABEL[actor.org.role])}` : undefined}
            labels={{ nav: t("Hauptnavigation"), menu: t("Menü"), close: t("Schließen"), account: t("Konto und Organisation") }}
          >
            <div className="acct">
              {actor.org && (
                <p className="acct-org">
                  <strong>{actor.org.name}</strong>
                  <span>{t(ORG_TYPE_LABEL[actor.org.type])} · {t(ROLE_LABEL[actor.org.role])}</span>
                </p>
              )}
              {memberships.length > 1 && actor.org && (
                <form action={switchOrgAction} className="inline">
                  <select name="orgId" defaultValue={actor.org.id} aria-label={t("Organisation wechseln")}>
                    {memberships.map((m) => (
                      <option key={m.organization.id} value={m.organization.id}>{m.organization.name}</option>
                    ))}
                  </select>
                  <button className="secondary" type="submit">{t("Wechseln")}</button>
                </form>
              )}
              <div className="acct-row">
                <LangSwitch path={path ?? "/dashboard"} />
                <form action={logoutAction}>
                  <button className="secondary" type="submit">{t("Abmelden")}</button>
                </form>
              </div>
            </div>
          </ShellNav>
        </div>
      </header>
      <main id="main" className={narrow ? "app narrow" : "app"}>{children}</main>
    </>
  );
}
