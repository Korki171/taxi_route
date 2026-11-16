import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Flash, type SP } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { adminResolveRatingReportAction } from "@/app/actions";
import { adminListRatingReports } from "@/server/services/ratings";
import { requireActor } from "@/server/web";

/** Gemeldete Bewertungskommentare: ausblenden (Sterne bleiben) oder Meldung ablehnen. */
export default async function AdminRatingReportsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const actor = await requireActor();
  if (!actor.isPlatformAdmin) notFound();
  const reports = await adminListRatingReports(actor);

  return (
    <AppShell actor={actor}>
      <p><Link href="/admin">← Administration</Link></p>
      <h1>Gemeldete Bewertungen</h1>
      <p className="sub">Ausblenden entfernt Kommentar und Antwort, die Sterne zählen weiter.</p>
      <Flash searchParams={sp} />
      {reports.length === 0 ? (
        <p className="card muted">Keine offenen Meldungen.</p>
      ) : (
        <div className="stack">
          {reports.map((rep) => (
            <section key={rep.id} className="card stack">
              <p className="flush">
                <strong>Bewertung für {rep.rating.toOrg.name}</strong> · {rep.rating.stars.toFixed(1).replace(".", ",")} von 5 Sternen ·{" "}
                gemeldet am {fmtDate(rep.createdAt, "de")} von {rep.orgId === rep.rating.toOrgId ? "der bewerteten Firma" : "der bewertenden Firma"}
                {" · "}<Link href={`/boerse/auftrag/${rep.rating.booking.requestId}`}>Auftrag</Link>
              </p>
              {rep.reason && <p className="flush">Grund: „{rep.reason}“</p>}
              {rep.rating.comment && <p className="flush">Kommentar: „{rep.rating.comment}“</p>}
              {rep.rating.reply && <p className="flush">Antwort: „{rep.rating.reply}“</p>}
              {rep.rating.commentHiddenAt && <p className="flush muted">Bereits ausgeblendet.</p>}
              <div className="actions-row">
                <form action={adminResolveRatingReportAction}>
                  <input type="hidden" name="reportId" value={rep.id} />
                  <input type="hidden" name="hide" value="1" />
                  <button type="submit" className="danger">Kommentar und Antwort ausblenden</button>
                </form>
                <form action={adminResolveRatingReportAction}>
                  <input type="hidden" name="reportId" value={rep.id} />
                  <input type="hidden" name="hide" value="0" />
                  <button type="submit" className="secondary">Meldung ablehnen</button>
                </form>
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
