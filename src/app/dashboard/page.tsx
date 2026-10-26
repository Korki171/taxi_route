import Link from "next/link";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { Badge, Flash, type SP } from "@/components/ui";
import {
  CAPABILITY_LABEL,
  ORG_STATUS_LABEL,
  ORG_TYPE_LABEL,
  VERIFICATION_LABEL,
  overallVerification,
} from "@/lib/labels";
import { actorCan } from "@/server/authz/context";
import { decide, type Permission } from "@/server/authz/permissions";
import { authzInput } from "@/server/authz/context";
import { requireOrgActor } from "@/server/web";

const FEATURES: { permission: Permission; label: string }[] = [
  { permission: "transfers.request", label: "Transferanfragen erstellen und Angebote einholen" },
  { permission: "bookings.manage", label: "Buchungen verwalten" },
  { permission: "fleet.manage", label: "Fahrzeuge verwalten" },
  { permission: "capacity.publish", label: "Freie Kapazitäten und Rückfahrten anbieten" },
  { permission: "jobs.accept", label: "Aufträge anderer Unternehmen übernehmen" },
  { permission: "quotes.submit", label: "Preisangebote abgeben" },
];

export default async function Dashboard({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const actor = await requireOrgActor();
  const org = await db.organization.findUniqueOrThrow({
    where: { id: actor.org.id },
    include: {
      capabilities: { orderBy: { capability: "asc" } },
      _count: { select: { documents: true, memberships: true } },
    },
  });
  const overall = overallVerification(org.status, org.capabilities);
  const isAgency = org.type === "TRAVEL_AGENCY";
  const input = authzInput(actor);

  return (
    <AppShell actor={actor}>
      <h1>{org.name}</h1>
      <p className="sub">
        {ORG_TYPE_LABEL[org.type]} · <Badge status={org.status}>{ORG_STATUS_LABEL[org.status]}</Badge>{" "}
        <span className={`badge ${overall.tone}`}>{overall.label}</span>
      </p>
      <Flash searchParams={sp} />

      <div className="grid">
        <section className="card">
          <h2>Verifizierung je Geschäftsfunktion</h2>
          <table>
            <tbody>
              {org.capabilities.map((c) => (
                <tr key={c.id}>
                  <td>{CAPABILITY_LABEL[c.capability]}</td>
                  <td><Badge status={c.status}>{VERIFICATION_LABEL[c.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">
            Eine Verifizierung bestätigt nicht automatisch jede Strecke oder Beförderungsart. Strecken- und
            grenzüberschreitende Berechtigungen werden gesondert geprüft.
          </p>
          {actorCan(actor, "org.update") && <Link href="/organization">Unternehmensdaten und Prüfung verwalten →</Link>}
        </section>

        <section className="card">
          <h2>Ihre Funktionen</h2>
          <table>
            <tbody>
              {FEATURES.map((f) => {
                const d = decide(input, f.permission);
                return (
                  <tr key={f.permission}>
                    <td>{f.label}</td>
                    <td>{d.allowed ? <Badge status="VERIFIED">Freigeschaltet</Badge> : <span className="muted">{d.reason}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Nächste Schritte</h2>
          <ul className="plain">
            <li>{org._count.memberships} Teammitglied(er) – <Link href="/organization/members">Team verwalten</Link></li>
            {!isAgency && (
              <li>
                {org._count.documents} Nachweis(e) hochgeladen –{" "}
                <Link href="/organization/documents">Konzession und Versicherung hinterlegen</Link>
              </li>
            )}
            {org.capabilities.some((c) => c.status === "UNVERIFIED" || c.status === "REJECTED") && (
              <li>Prüfung beantragen unter <Link href="/organization">Unternehmen</Link></li>
            )}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>{isAgency ? "Transferanfragen und Buchungen" : "Auftragsbörse"}</h2>
        <p className="muted">
          {isAgency
            ? "Transferanfragen, Angebotsvergleich und Buchungsverwaltung werden in Phase 4 umgesetzt."
            : "Aufträge, freie Kapazitäten, Rückfahrten und Preisangebote werden in Phase 3 umgesetzt."}{" "}
          Diese Phase stellt Organisationen, Rollen, Anmeldung und Verifizierung bereit.
        </p>
      </section>
    </AppShell>
  );
}
