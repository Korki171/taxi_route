import { headers } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { Flash, type SP } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/labels";
import { actorCan } from "@/server/authz/context";
import { assignableRoles } from "@/server/authz/permissions";
import { listInvitations, listMembers } from "@/server/services/members";
import { requireOrgActor } from "@/server/web";
import { changeRoleAction, inviteMemberAction, removeMemberAction, revokeInvitationAction } from "../../actions";

const ROLE_HELP: Record<string, string> = {
  OWNER: "Alle Rechte inkl. Inhaberverwaltung",
  ADMIN: "Alle Rechte außer Inhaberverwaltung",
  DISPATCHER: "Disposition: Flotte, Kapazitäten, Aufträge, Angebote",
  BOOKER: "Transfers anfragen und Buchungen verwalten",
  FINANCE: "Abrechnung und Nachweise einsehen",
  VIEWER: "Nur lesen",
};

export default async function MembersPage({ searchParams }: { searchParams: SP }) {
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
      <h1>Team</h1>
      <p className="sub">Mitarbeiter haben eigene Zugänge mit Rollen innerhalb Ihrer Organisation.</p>
      <Flash searchParams={sp} />
      {sp.invite && (
        <div className="card">
          <h2>Einladungslink</h2>
          <p>Senden Sie diesen Link an die eingeladene Person. Er ist 7 Tage gültig und wird nur jetzt angezeigt.</p>
          <code className="copy">{`${origin}/invite/${sp.invite}`}</code>
        </div>
      )}

      <section className="card">
        <h2>Mitglieder</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th></th></tr></thead>
            <tbody>
              {members.map((m) => {
                const editable = manage && roles.includes(m.role) && m.user.id !== actor.userId;
                return (
                  <tr key={m.id}>
                    <td>{m.user.name}{m.user.id === actor.userId && <span className="muted"> (Sie)</span>}</td>
                    <td>{m.user.email}</td>
                    <td>
                      {editable ? (
                        <form action={changeRoleAction} className="inline">
                          <input type="hidden" name="membershipId" value={m.id} />
                          <select name="role" defaultValue={m.role}>
                            {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                          </select>
                          <button type="submit" className="secondary">Ändern</button>
                        </form>
                      ) : (
                        ROLE_LABEL[m.role]
                      )}
                    </td>
                    <td>
                      {editable && (
                        <form action={removeMemberAction}>
                          <input type="hidden" name="membershipId" value={m.id} />
                          <button type="submit" className="danger">Entfernen</button>
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
            <h2>Mitarbeiter einladen</h2>
            <form action={inviteMemberAction} className="stack">
              <label>E-Mail<input name="email" type="email" required /></label>
              <label>
                Rolle
                <select name="role" defaultValue="BOOKER">
                  {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]} – {ROLE_HELP[r]}</option>)}
                </select>
              </label>
              <div><button type="submit">Einladung erstellen</button></div>
            </form>
          </section>
          <section className="card">
            <h2>Offene Einladungen</h2>
            {invitations.length === 0 ? (
              <p className="muted">Keine offenen Einladungen.</p>
            ) : (
              <table>
                <tbody>
                  {invitations.map((i) => (
                    <tr key={i.id}>
                      <td>{i.email}</td>
                      <td>{ROLE_LABEL[i.role]}</td>
                      <td className="muted">bis {i.expiresAt.toLocaleDateString("de-AT")}</td>
                      <td>
                        <form action={revokeInvitationAction}>
                          <input type="hidden" name="invitationId" value={i.id} />
                          <button type="submit" className="link">Widerrufen</button>
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
