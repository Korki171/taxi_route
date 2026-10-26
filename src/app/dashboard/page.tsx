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
import { getI18n } from "@/server/i18n";
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
  const { t } = await getI18n();
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
        {t(ORG_TYPE_LABEL[org.type])} · <Badge status={org.status}>{t(ORG_STATUS_LABEL[org.status])}</Badge>{" "}
        <span className={`badge ${overall.tone}`}>{t(overall.label)}</span>
      </p>
      <Flash searchParams={sp} />

      <div className="grid">
        <section className="card">
          <h2>{t("Verifizierung je Geschäftsfunktion")}</h2>
          <table>
            <tbody>
              {org.capabilities.map((c) => (
                <tr key={c.id}>
                  <td>{t(CAPABILITY_LABEL[c.capability])}</td>
                  <td><Badge status={c.status}>{t(VERIFICATION_LABEL[c.status])}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">{t("Eine Verifizierung bestätigt nicht automatisch jede Strecke oder Beförderungsart. Strecken- und grenzüberschreitende Berechtigungen werden gesondert geprüft.")}</p>
          {actorCan(actor, "org.update") && <Link href="/organization">{t("Unternehmensdaten und Prüfung verwalten")} →</Link>}
        </section>

        <section className="card">
          <h2>{t("Ihre Funktionen")}</h2>
          <table>
            <tbody>
              {FEATURES.map((f) => {
                const d = decide(input, f.permission);
                return (
                  <tr key={f.permission}>
                    <td>{t(f.label)}</td>
                    <td>{d.allowed ? <Badge status="VERIFIED">{t("Freigeschaltet")}</Badge> : <span className="muted">{t(d.reason)}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>{t("Nächste Schritte")}</h2>
          <ul className="plain">
            <li>{t("{n} Teammitglied(er)", { n: org._count.memberships })} – <Link href="/organization/members">{t("Team verwalten")}</Link></li>
            {!isAgency && (
              <li>
                {t("{n} Nachweis(e) hochgeladen", { n: org._count.documents })} –{" "}
                <Link href="/organization/documents">{t("Konzession und Versicherung hinterlegen")}</Link>
              </li>
            )}
            {org.capabilities.some((c) => c.status === "UNVERIFIED" || c.status === "REJECTED") && (
              <li>{t("Prüfung beantragen unter")} <Link href="/organization">{t("Unternehmen")}</Link></li>
            )}
          </ul>
        </section>
      </div>

      {(actorCan(actor, "jobs.accept") || actorCan(actor, "transfers.request")) && (
        <section className="card">
          <h2>{t("Auftragsbörse")}</h2>
          <p className="muted">{isAgency
            ? t("Stellen Sie Transfers ein, vergleichen Sie Angebote und behalten Sie Ihre Buchungen im Blick.")
            : t("Finden Sie passende Aufträge, geben Sie Angebote ab und füllen Sie leere Rückfahrten.")}</p>
          <div className="inline">
            <Link href="/boerse"><button type="button">{t("Zur Börse")}</button></Link>
            {actorCan(actor, "transfers.request") && <Link href="/boerse/neu"><button type="button" className="secondary">{t("Auftrag einstellen")}</button></Link>}
          </div>
        </section>
      )}
    </AppShell>
  );
}
