import Link from "next/link";
import { db } from "@/lib/db";
import { ORG_TYPE_LABEL, ROLE_LABEL } from "@/lib/labels";
import type { Actor } from "@/server/authz/context";
import { actorCan } from "@/server/authz/context";
import { logoutAction, switchOrgAction } from "@/app/actions";
import { getI18n } from "@/server/i18n";
import { LangSwitch } from "./LangSwitch";

export async function AppShell({ actor, children, narrow, path }: { actor: Actor; children: React.ReactNode; narrow?: boolean; path?: string }) {
  const { t } = await getI18n();
  const memberships = await db.membership.findMany({
    where: { userId: actor.userId },
    select: { organization: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return (
    <>
      <header className="top">
        <div className="inner">
          <Link href="/dashboard" className="brand">TaxiRoute</Link>
          <nav>
            {actor.org && <Link href="/dashboard">{t("Übersicht")}</Link>}
            {(actorCan(actor, "jobs.accept") || actorCan(actor, "transfers.request")) && <Link href="/boerse">{t("Börse")}</Link>}
            {actorCan(actor, "fleet.manage") && <Link href="/flotte">{t("Flotte")}</Link>}
            {actor.org && <Link href="/organization">{t("Unternehmen")}</Link>}
            {actor.org && <Link href="/organization/members">{t("Team")}</Link>}
            {actorCan(actor, "documents.read") && <Link href="/organization/documents">{t("Nachweise")}</Link>}
            {actor.isPlatformAdmin && <Link href="/admin">{t("Administration")}</Link>}
          </nav>
          <div className="who">
            {memberships.length > 1 && actor.org ? (
              <form action={switchOrgAction} className="inline">
                <select name="orgId" defaultValue={actor.org.id} aria-label={t("Organisation wechseln")}>
                  {memberships.map((m) => (
                    <option key={m.organization.id} value={m.organization.id}>{m.organization.name}</option>
                  ))}
                </select>
                <button className="secondary" type="submit">{t("Wechseln")}</button>
              </form>
            ) : (
              actor.org && <span>{actor.org.name}</span>
            )}
            {actor.org && (
              <span title={t(ORG_TYPE_LABEL[actor.org.type])}>· {t(ROLE_LABEL[actor.org.role])}</span>
            )}
            <span>{actor.org ? "· " : ""}{actor.name}</span>
            <form action={logoutAction}>
              <button className="link" type="submit">{t("Abmelden")}</button>
            </form>
            <LangSwitch path={path ?? "/dashboard"} />
          </div>
        </div>
      </header>
      <main className={narrow ? "narrow" : undefined}>{children}</main>
    </>
  );
}
