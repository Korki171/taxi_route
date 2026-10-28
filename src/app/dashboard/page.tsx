import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { AgencyOverview } from "@/components/AgencyOverview";
import { AppShell } from "@/components/AppShell";
import { Route } from "@/components/market";
import { Badge, Flash, type SP } from "@/components/ui";
import {
  BOOKING_STATUS_LABEL,
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
import { listBookings, listIncomingQuotes, listInvitations, listOwnRequests, searchBoard } from "@/server/services/marketplace";
import { requireOrgActor } from "@/server/web";

const FEATURES: { permission: Permission; label: string }[] = [
  { permission: "transfers.request", label: "Transferanfragen erstellen und Angebote einholen" },
  { permission: "bookings.manage", label: "Buchungen verwalten" },
  { permission: "fleet.manage", label: "Fahrzeuge verwalten" },
  { permission: "capacity.publish", label: "Freie Kapazitäten und Rückfahrten anbieten" },
  { permission: "jobs.accept", label: "Aufträge anderer Unternehmen übernehmen" },
  { permission: "quotes.submit", label: "Preisangebote abgeben" },
];

type Figure = { n: number; label: string; href: string; hot?: boolean };

export default async function Dashboard({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const actor = await requireOrgActor();
  // Fahrer brauchen keine Unternehmensübersicht, nur ihre Fahrten.
  if (actor.org.role === "DRIVER") redirect("/fahrer");
  const { t, f } = await getI18n();
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
  const canMarket = actorCan(actor, "jobs.accept");
  const canRequest = actorCan(actor, "transfers.request");
  // Reine Auftraggeber (Reisebüros) bekommen die Transferübersicht statt der Börsenansicht.
  const agencyMode = canRequest && !canMarket;

  const [market, invitations, incoming, ownOpen, upcoming] = await Promise.all([
    canMarket ? searchBoard(actor, {}) : null,
    canMarket ? listInvitations(actor) : null,
    actorCan(actor, "bookings.manage") ? listIncomingQuotes(actor) : null,
    canRequest ? listOwnRequests(actor, ["OPEN"]) : null,
    actorCan(actor, "org.read") ? listBookings(actor, "both", ["CONFIRMED", "IN_PROGRESS"]) : [],
  ]);

  // Zahlen im Navy-Feld: jede führt zur Ansicht, in der man sie abarbeitet.
  const figures: Figure[] = [];
  if (invitations) figures.push({ n: invitations.length, label: t("Direktanfragen an Ihr Unternehmen"), href: "/boerse?view=anfragen", hot: invitations.length > 0 });
  if (incoming) figures.push({ n: incoming.length, label: t("Angebote warten auf Ihre Entscheidung"), href: "/boerse?view=angebote", hot: incoming.length > 0 });
  if (market) figures.push({ n: market.length, label: t("offene Aufträge anderer Unternehmen in der Börse"), href: "/boerse" });
  if (ownOpen) figures.push({ n: ownOpen.length, label: t("eigene Aufträge noch nicht vergeben"), href: "/boerse?view=meine" });
  if (canMarket || canRequest) figures.push({ n: upcoming.length, label: t("bestätigte Fahrten stehen an"), href: canMarket ? "/boerse?view=uebernommen" : "/boerse?view=meine" });
  const next = upcoming.slice(0, 5);
  const needsReview = org.capabilities.some((c) => c.status === "UNVERIFIED" || c.status === "REJECTED");

  return (
    <AppShell actor={actor}>
      <h1>{org.name}</h1>
      <p className="sub">
        {t(ORG_TYPE_LABEL[org.type])} · <Badge status={org.status}>{t(ORG_STATUS_LABEL[org.status])}</Badge>{" "}
        <span className={`badge ${overall.tone}`}>{t(overall.label)}</span>
      </p>
      <Flash searchParams={sp} />

      {figures.length > 0 ? (
        <section className="band" aria-label={t("Auftragsbörse")}>
          <ul className="band-figures">
            {figures.map((x) => (
              <li key={x.href + x.label}>
                <Link href={x.href}>
                  <span className={x.hot ? "fig hot" : "fig"}>{x.n}</span>
                  <span className="fig-label">{x.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="band-actions">
            {canRequest && <Link href="/boerse/neu" className="btn accent">{t("Auftrag einstellen")}</Link>}
            {agencyMode && <Link href="/boerse/neu?gezielt=1#anbieter" className="btn secondary">{t("Unternehmen gezielt anfragen")}</Link>}
            <Link href="/boerse" className={canRequest ? "btn secondary" : "btn accent"}>{t("Zur Börse")}</Link>
            {actorCan(actor, "capacity.publish") && <Link href="/flotte#fahrt" className="btn secondary">{t("Rückfahrt anbieten")}</Link>}
          </div>
        </section>
      ) : (
        <section className="band">
          <p className="band-line">
            {isAgency
              ? t("Sobald Transferborsa Ihr Reisebüro freigeschaltet hat, stellen Sie hier Transfers ein und vergleichen Angebote.")
              : t("Sobald Konzession und Versicherung geprüft sind, schalten wir die Börse für Sie frei.")}
          </p>
          {actorCan(actor, "org.update") && (
            <div className="band-actions">
              <Link href={isAgency ? "/organization" : "/organization/documents"} className="btn accent">
                {isAgency ? t("Prüfung beantragen") : t("Konzession und Versicherung hinterlegen")}
              </Link>
            </div>
          )}
        </section>
      )}

      {agencyMode && <AgencyOverview actor={actor} q={sp.q} />}

      <div className="split">
        <div className="col">
          {canMarket && (
            <section className="card">
              <div className="head-row">
                <h2>{t("Nächste Fahrten")}</h2>
                {upcoming.length > next.length && <Link href={canMarket ? "/boerse?view=uebernommen" : "/boerse?view=meine"}>{t("Alle {n} ansehen", { n: upcoming.length })}</Link>}
              </div>
              {next.length === 0 ? (
                <p className="empty">{t("Keine bestätigten Fahrten in nächster Zeit.")}</p>
              ) : (
                <table className="responsive">
                  <tbody>
                    {next.map((b) => {
                      const asProvider = b.providerOrgId === actor.org.id;
                      return (
                        <tr key={b.id}>
                          <td className="nowrap">{f.dateTime(b.request.pickupAt)}</td>
                          <td>
                            <Route from={b.request.pickupPlaceId} to={b.request.dropoffPlaceId} href={`/boerse/auftrag/${b.request.id}`} />
                            <span className="price-note">{asProvider ? t("für {org}", { org: b.requesterOrg.name }) : t("fährt {org}", { org: b.providerOrg.name })} · {t("{n} Pers.", { n: b.request.passengers })}</span>
                          </td>
                          <td className="num price-fixed">{f.money(b.agreedPriceCents)}</td>
                          <td className="nowrap"><Badge status={b.status}>{t(BOOKING_STATUS_LABEL[b.status])}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          )}

          <section className="card">
            <h2>{t("Nächste Schritte")}</h2>
            <ul className="steps">
              <li>
                <span>{t("{n} Teammitglied(er)", { n: org._count.memberships })}</span>
                <Link href="/organization/members">{t("Team verwalten")}</Link>
              </li>
              {!isAgency && (
                <li>
                  <span>{t("{n} Nachweis(e) hochgeladen", { n: org._count.documents })}</span>
                  <Link href="/organization/documents">{t("Konzession und Versicherung hinterlegen")}</Link>
                </li>
              )}
              {needsReview && (
                <li>
                  <span>{t("Prüfung beantragen unter")} {t("Unternehmen")}</span>
                  <Link href="/organization">{t("Unternehmen")}</Link>
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className="col">
          <section className="card">
            <h2>{t("Verifizierung je Geschäftsfunktion")}</h2>
            <table>
              <tbody>
                {org.capabilities.map((c) => (
                  <tr key={c.id}>
                    <td>{t(CAPABILITY_LABEL[c.capability])}</td>
                    <td className="num"><Badge status={c.status}>{t(VERIFICATION_LABEL[c.status])}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="price-note">{t("Eine Verifizierung bestätigt nicht automatisch jede Strecke oder Beförderungsart. Strecken- und grenzüberschreitende Berechtigungen werden gesondert geprüft.")}</p>
            {actorCan(actor, "org.update") && <p className="flush"><Link href="/organization">{t("Unternehmensdaten und Prüfung verwalten")} →</Link></p>}
          </section>

          <section className="card">
            <h2>{t("Ihre Funktionen")}</h2>
            <table>
              <tbody>
                {FEATURES.map((x) => {
                  const d = decide(input, x.permission);
                  return (
                    <tr key={x.permission}>
                      <td>{t(x.label)}</td>
                      <td className="num">{d.allowed ? <Badge status="VERIFIED">{t("Freigeschaltet")}</Badge> : <span className="muted wrap">{t(d.reason)}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
