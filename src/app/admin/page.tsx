import type { OrganizationType, VerificationStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Badge, type SP } from "@/components/ui";
import { CAPABILITY_LABEL, ORG_STATUS_LABEL, ORG_TYPE_LABEL, VERIFICATION_LABEL } from "@/lib/labels";
import { adminListOrganizations } from "@/server/services/admin";
import { requireActor } from "@/server/web";

const TYPES = ["TRANSPORT_COMPANY", "TRAVEL_AGENCY"] as const;
const STATUSES = ["UNVERIFIED", "PENDING_REVIEW", "VERIFIED", "REJECTED", "SUSPENDED"] as const;

export default async function AdminPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const actor = await requireActor();
  if (!actor.isPlatformAdmin) notFound();
  const type = TYPES.find((t) => t === sp.type) as OrganizationType | undefined;
  const capabilityStatus = STATUSES.find((s) => s === sp.status) as VerificationStatus | undefined;
  const orgs = await adminListOrganizations(actor, { q: sp.q || undefined, type, capabilityStatus });

  return (
    <AppShell actor={actor}>
      <h1>Administration</h1>
      <p className="sub">Unternehmen prüfen, freischalten, einschränken oder sperren</p>
      <form className="card inline" method="get">
        <input name="q" placeholder="Firmenname" defaultValue={sp.q ?? ""} />
        <select name="type" defaultValue={type ?? ""}>
          <option value="">Alle Typen</option>
          {TYPES.map((t) => <option key={t} value={t}>{ORG_TYPE_LABEL[t]}</option>)}
        </select>
        <select name="status" defaultValue={capabilityStatus ?? ""}>
          <option value="">Alle Prüfstatus</option>
          {STATUSES.map((s) => <option key={s} value={s}>{VERIFICATION_LABEL[s]}</option>)}
        </select>
        <button type="submit">Filtern</button>
      </form>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Unternehmen</th><th>Typ</th><th>Ort</th><th>Konto</th><th>Funktionen</th><th>Mitgl./Dok.</th><th>Registriert</th></tr></thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/organizations/${o.id}`}>{o.name}</Link></td>
                <td>{ORG_TYPE_LABEL[o.type]}</td>
                <td>{o.city}, {o.country}</td>
                <td><Badge status={o.status}>{ORG_STATUS_LABEL[o.status]}</Badge></td>
                <td>
                  {o.capabilities.map((c) => (
                    <div key={c.id} title={CAPABILITY_LABEL[c.capability]}>
                      {c.capability === "TRANSPORT_PROVIDER" ? "Beförderung" : "Auftraggeber"}:{" "}
                      <Badge status={c.status}>{VERIFICATION_LABEL[c.status]}</Badge>
                    </div>
                  ))}
                </td>
                <td>{o._count.memberships} / {o._count.documents}</td>
                <td>{o.createdAt.toLocaleDateString("de-AT")}</td>
              </tr>
            ))}
            {orgs.length === 0 && <tr><td colSpan={7} className="muted">Keine Unternehmen gefunden.</td></tr>}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
