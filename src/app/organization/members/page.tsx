import { headers } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { Flash, type SP } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/labels";
import { actorCan } from "@/server/authz/context";
import { assignableRoles } from "@/server/authz/permissions";
import { listInvitations, listMembers } from "@/server/services/members";
import { requireOrgActor } from "@/server/web";
import { changeRoleAction, inviteMemberAction, removeMemberAction, revokeInvitationAction } from "../../actions";
import { getI18n } from "@/server/i18n";

const ROLE_HELP: Record<string, string> = {
  OWNER: "Alle Rechte inkl. Inhaberverwaltung",
  ADMIN: "Alle Rechte außer Inhaberverwaltung",
  DISPATCHER: "Disposition: Flotte, Kapazitäten, Aufträge, Angebote",
  BOOKER: "Transfers anfragen und Buchungen verwalten",
  FINANCE: "Abrechnung und Nachweise einsehen",
  VIEWER: "Nur lesen",
  DRIVER: "Eigene Fahrten sehen und Standort während der Schicht teilen",
};

export default async function MembersPage({ searchParams }: { searchParams: SP }) {
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const actor = await requireOrgActor();
  const members = await listMembers(actor);
  const manage = actorCan(actor, "members.manage");
  const invitations = manage ? await listInvitations(actor) : [];
  const roles = assignableRoles(actor.org.role);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <AppShell actor={actor}>
      <h1>{t("Team")}</h1>
      <p className="sub">{t("Mitarbeiter haben eigene Zugänge mit Rollen innerhalb Ihrer Organisation.")}</p>
      <Flash searchParams={sp} />
      {sp.invite && (
        <div className="card">
          <h2>{t("Einladungslink")}</h2>
          <p>{t("Senden Sie diesen Link an die eingeladene Person. Er ist 7 Tage gültig und wird nur jetzt angezeigt.")}</p>
          <code className="copy">{`${origin}/invite/${sp.invite}`}</code>
        </div>
      )}

      <section className="card">
        <h2>{t("Mitglieder")}</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Name")}</th><th>{t("E-Mail")}</th><th>{t("Rolle")}</th><th></th></tr></thead>
            <tbody>
              {members.map((m) => {
                const editable = manage && roles.includes(m.role) && m.user.id !== actor.userId;
                return (
                  <tr key={m.id}>
                    <td>{m.user.name}{m.user.id === actor.userId && <span className="muted">{" "}{t("(Sie)")}</span>}</td>
                    <td>{m.user.email}</td>
                    <td>
                      {editable ? (
                        <form action={changeRoleAction} className="inline">
                          <input type="hidden" name="membershipId" value={m.id} />
                          <select name="role" defaultValue={m.role}>
                            {roles.map((r) => <option key={r} value={r}>{t(ROLE_LABEL[r])}</option>)}
                          </select>
                          <button type="submit" className="secondary">{t("Ändern")}</button>
                        </form>
                      ) : (
                        t(ROLE_LABEL[m.role])
                      )}
                    </td>
                    <td>
                      {editable && (
                        <form action={removeMemberAction}>
                          <input type="hidden" name="membershipId" value={m.id} />
                          <button type="submit" className="danger">{t("Entfernen")}</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {manage && (
        <div className="grid">
          <section className="card">
            <h2>{t("Mitarbeiter einladen")}</h2>
            <form action={inviteMemberAction} className="stack">
              <label>{t("E-Mail")}<input name="email" type="email" required /></label>
              <label>
                {t("Rolle")}
                <select name="role" defaultValue="BOOKER">
                  {roles.map((r) => <option key={r} value={r}>{t(ROLE_LABEL[r])} – {t(ROLE_HELP[r])}</option>)}
                </select>
              </label>
              <div><button type="submit">{t("Einladung erstellen")}</button></div>
            </form>
          </section>
          <section className="card">
            <h2>{t("Offene Einladungen")}</h2>
            {invitations.length === 0 ? (
              <p className="muted">{t("Keine offenen Einladungen.")}</p>
            ) : (
              <table>
                <tbody>
                  {invitations.map((i) => (
                    <tr key={i.id}>
                      <td>{i.email}</td>
                      <td>{t(ROLE_LABEL[i.role])}</td>
                      <td className="muted">bis {i.expiresAt.toLocaleDateString("de-AT")}</td>
                      <td>
                        <form action={revokeInvitationAction}>
                          <input type="hidden" name="invitationId" value={i.id} />
                          <button type="submit" className="link">{t("Widerrufen")}</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
