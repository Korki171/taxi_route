import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Badge, Flash, type SP } from "@/components/ui";
import {
  CAPABILITY_LABEL,
  DOC_STATUS_LABEL,
  ORG_STATUS_LABEL,
  ORG_TYPE_LABEL,
  ROLE_LABEL,
  VEHICLE_LABEL,
  VERIFICATION_LABEL,
} from "@/lib/labels";
import { AppError } from "@/server/errors";
import { adminGetOrganization } from "@/server/services/admin";
import { DOCUMENT_LABELS } from "@/server/services/verification-rules";
import { requireActor } from "@/server/web";
import {
  adminReviewCapabilityAction,
  adminReviewDocumentAction,
  adminSetOrgStatusAction,
} from "../../../actions";

export default async function AdminOrgPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  const sp = await searchParams;
  const actor = await requireActor();
  if (!actor.isPlatformAdmin) notFound();
  const org = await adminGetOrganization(actor, id).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const now = new Date();

  return (
    <AppShell actor={actor}>
      <h1>{org.name}</h1>
      <p className="sub">
        {ORG_TYPE_LABEL[org.type]} · <Badge status={org.status}>{ORG_STATUS_LABEL[org.status]}</Badge>
      </p>
      <Flash searchParams={sp} />

      <div className="grid">
        <section className="card">
          <h2>Stammdaten</h2>
          <dl className="kv">
            <dt>Rechtl. Name</dt><dd>{org.legalName ?? "–"}</dd>
            <dt>Adresse</dt><dd>{org.street}, {org.postalCode} {org.city}, {org.country}</dd>
            <dt>Kontakt</dt><dd>{org.contactPerson ?? "–"} · {org.email} · {org.phone}</dd>
            <dt>UID</dt><dd>{org.vatId ?? "–"}</dd>
            <dt>Register-Nr.</dt><dd>{org.registerNumber ?? "–"}</dd>
            {org.transportProfile && (
              <>
                <dt>Konzession</dt><dd>{org.transportProfile.concessionNumber ?? "–"}</dd>
                <dt>Fahrzeuge</dt>
                <dd>
                  {org.transportProfile.fleetSize ?? "?"} ·{" "}
                  {org.transportProfile.vehicleCategories.map((v) => VEHICLE_LABEL[v]).join(", ") || "–"}
                </dd>
                <dt>Einsatzgebiete</dt><dd>{org.transportProfile.declaredRegions.join(", ") || "–"}</dd>
              </>
            )}
          </dl>
        </section>
        <section className="card">
          <h2>Kontostatus</h2>
          <form action={adminSetOrgStatusAction} className="stack">
            <input type="hidden" name="orgId" value={org.id} />
            <select name="status" defaultValue={org.status}>
              {(["ACTIVE", "RESTRICTED", "SUSPENDED"] as const).map((s) => (
                <option key={s} value={s}>{ORG_STATUS_LABEL[s]}</option>
              ))}
            </select>
            <input name="note" placeholder="Begründung (wird protokolliert)" />
            <div><button type="submit">Status setzen</button></div>
          </form>
        </section>
      </div>

      <section className="card">
        <h2>Geschäftsfunktionen</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Funktion</th><th>Status</th><th>Entscheidung</th></tr></thead>
            <tbody>
              {org.capabilities.map((c) => (
                <tr key={c.id}>
                  <td>{CAPABILITY_LABEL[c.capability]}</td>
                  <td>
                    <Badge status={c.status}>{VERIFICATION_LABEL[c.status]}</Badge>
                    {c.reviewNote && <div className="muted">{c.reviewNote}</div>}
                  </td>
                  <td>
                    <form action={adminReviewCapabilityAction} className="inline">
                      <input type="hidden" name="orgId" value={org.id} />
                      <input type="hidden" name="capability" value={c.capability} />
                      <select name="status" defaultValue="VERIFIED">
                        <option value="VERIFIED">Freigeben</option>
                        <option value="REJECTED">Ablehnen</option>
                        <option value="SUSPENDED">Sperren</option>
                      </select>
                      <input name="note" placeholder="Hinweis" />
                      <button type="submit" className="secondary">Speichern</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Nachweise</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Art</th><th>Dokument</th><th>Gültig bis</th><th>Status</th><th>Prüfung</th></tr></thead>
            <tbody>
              {org.documents.map((d) => (
                <tr key={d.id}>
                  <td>{DOCUMENT_LABELS[d.type]}</td>
                  <td><a href={`/api/documents/${d.id}`}>{d.title}</a></td>
                  <td>
                    {d.validUntil ? d.validUntil.toLocaleDateString("de-AT") : "–"}{" "}
                    {d.validUntil && d.validUntil <= now && <Badge status="REJECTED">Abgelaufen</Badge>}
                  </td>
                  <td><Badge status={d.status}>{DOC_STATUS_LABEL[d.status]}</Badge></td>
                  <td>
                    <form action={adminReviewDocumentAction} className="inline">
                      <input type="hidden" name="orgId" value={org.id} />
                      <input type="hidden" name="documentId" value={d.id} />
                      <select name="status" defaultValue="APPROVED">
                        <option value="APPROVED">Akzeptieren</option>
                        <option value="REJECTED">Ablehnen</option>
                      </select>
                      <input name="note" placeholder="Hinweis" />
                      <button type="submit" className="secondary">Speichern</button>
                    </form>
                  </td>
                </tr>
              ))}
              {org.documents.length === 0 && <tr><td colSpan={5} className="muted">Keine Dokumente.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid">
        <section className="card">
          <h2>Mitglieder</h2>
          <table>
            <tbody>
              {org.memberships.map((m) => (
                <tr key={m.id}><td>{m.user.name}</td><td>{m.user.email}</td><td>{ROLE_LABEL[m.role]}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card">
          <h2>Protokoll</h2>
          <table>
            <tbody>
              {org.auditEvents.map((e) => (
                <tr key={e.id}>
                  <td className="muted">{e.createdAt.toLocaleString("de-AT")}</td>
                  <td>{e.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
