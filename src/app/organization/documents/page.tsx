import type { DocumentType } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Badge, Flash, type SP } from "@/components/ui";
import { DOC_STATUS_LABEL } from "@/lib/labels";
import { actorCan } from "@/server/authz/context";
import { listOwnDocuments } from "@/server/services/documents";
import { DOCUMENT_LABELS } from "@/server/services/verification-rules";
import { requireOrgActor } from "@/server/web";
import { deleteDocumentAction, uploadDocumentAction } from "../../actions";

export default async function DocumentsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const actor = await requireOrgActor();
  if (!actorCan(actor, "documents.read")) redirect("/dashboard");
  const docs = await listOwnDocuments(actor);
  const manage = actorCan(actor, "documents.manage");
  const now = new Date();

  return (
    <AppShell actor={actor}>
      <h1>Nachweise</h1>
      <p className="sub">
        Gewerbe-, Konzessions- und Versicherungsnachweise. Nur Ihre Organisation und die TaxiRoute-Prüfer haben Zugriff.
      </p>
      <Flash searchParams={sp} />

      <section className="card">
        <h2>Hinterlegte Dokumente</h2>
        {docs.length === 0 ? (
          <p className="muted">Noch keine Dokumente hochgeladen.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Art</th><th>Bezeichnung</th><th>Gültig bis</th><th>Status</th><th>Hinweis</th><th></th></tr></thead>
              <tbody>
                {docs.map((d) => {
                  const expired = d.validUntil && d.validUntil <= now;
                  return (
                    <tr key={d.id}>
                      <td>{DOCUMENT_LABELS[d.type]}</td>
                      <td><a href={`/api/documents/${d.id}`}>{d.title}</a> <span className="muted">({Math.ceil(d.sizeBytes / 1024)} KB)</span></td>
                      <td>{d.validUntil ? d.validUntil.toLocaleDateString("de-AT") : "–"} {expired && <Badge status="REJECTED">Abgelaufen</Badge>}</td>
                      <td><Badge status={d.status}>{DOC_STATUS_LABEL[d.status]}</Badge></td>
                      <td className="muted">{d.reviewNote}</td>
                      <td>
                        {manage && d.status !== "APPROVED" && (
                          <form action={deleteDocumentAction}>
                            <input type="hidden" name="documentId" value={d.id} />
                            <button type="submit" className="link">Löschen</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {manage && (
        <section className="card">
          <h2>Dokument hochladen</h2>
          <form action={uploadDocumentAction} className="stack">
            <div className="fields">
              <label>
                Art
                <select name="type" required>
                  {(Object.keys(DOCUMENT_LABELS) as DocumentType[]).map((t) => (
                    <option key={t} value={t}>{DOCUMENT_LABELS[t]}</option>
                  ))}
                </select>
              </label>
              <label>Bezeichnung<input name="title" required placeholder="z. B. Taxikonzession Innsbruck" /></label>
              <label>Gültig bis <small>optional</small><input name="validUntil" type="date" /></label>
            </div>
            <label>Datei <small>PDF, PNG oder JPEG, max. 5 MB</small><input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" required /></label>
            <div><button type="submit">Hochladen</button></div>
          </form>
        </section>
      )}
    </AppShell>
  );
}
