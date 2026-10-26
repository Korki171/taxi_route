import Link from "next/link";
import { db } from "@/lib/db";
import { ORG_TYPE_LABEL, ROLE_LABEL } from "@/lib/labels";
import type { Actor } from "@/server/authz/context";
import { actorCan } from "@/server/authz/context";
import { logoutAction, switchOrgAction } from "@/app/actions";

export async function AppShell({ actor, children, narrow }: { actor: Actor; children: React.ReactNode; narrow?: boolean }) {
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
            {actor.org && <Link href="/dashboard">Übersicht</Link>}
            {(actorCan(actor, "jobs.accept") || actorCan(actor, "transfers.request")) && <Link href="/boerse">Börse</Link>}
            {actorCan(actor, "fleet.manage") && <Link href="/flotte">Flotte</Link>}
            {actor.org && <Link href="/organization">Unternehmen</Link>}
            {actor.org && <Link href="/organization/members">Team</Link>}
            {actorCan(actor, "documents.read") && <Link href="/organization/documents">Nachweise</Link>}
            {actor.isPlatformAdmin && <Link href="/admin">Administration</Link>}
          </nav>
          <div className="who">
            {memberships.length > 1 && actor.org ? (
              <form action={switchOrgAction} className="inline">
                <select name="orgId" defaultValue={actor.org.id} aria-label="Organisation wechseln">
                  {memberships.map((m) => (
                    <option key={m.organization.id} value={m.organization.id}>{m.organization.name}</option>
                  ))}
                </select>
                <button className="secondary" type="submit">Wechseln</button>
              </form>
            ) : (
              actor.org && <span>{actor.org.name}</span>
            )}
            {actor.org && (
              <span title={ORG_TYPE_LABEL[actor.org.type]}>· {ROLE_LABEL[actor.org.role]}</span>
            )}
            <span>{actor.org ? "· " : ""}{actor.name}</span>
            <form action={logoutAction}>
              <button className="link" type="submit">Abmelden</button>
            </form>
          </div>
        </div>
      </header>
      <main className={narrow ? "narrow" : undefined}>{children}</main>
    </>
  );
}
