import Link from "next/link";
import { Flash, type SP } from "@/components/ui";
import { ORG_TYPE_LABEL, ROLE_LABEL } from "@/lib/labels";
import { AppError } from "@/server/errors";
import { getInvitationPreview } from "@/server/services/members";
import { getActor } from "@/server/web";
import { acceptInvitationAction, registerViaInvitationAction } from "../../actions";

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: SP }) {
  const { token } = await params;
  const sp = await searchParams;
  let preview;
  try {
    preview = await getInvitationPreview(token);
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    return (
      <main className="narrow">
        <h1>Einladung</h1>
        <div className="flash error">{e.message}</div>
        <Link href="/login">Zur Anmeldung</Link>
      </main>
    );
  }
  const actor = await getActor();

  return (
    <main className="narrow">
      <h1>Einladung zu {preview.organization.name}</h1>
      <p className="sub">
        {ORG_TYPE_LABEL[preview.organization.type]} · Rolle: {ROLE_LABEL[preview.role]} · für {preview.email}
      </p>
      <Flash searchParams={sp} />
      {actor ? (
        <div className="card">
          {actor.email === preview.email ? (
            <form action={acceptInvitationAction.bind(null, token)}>
              <button type="submit">Einladung annehmen</button>
            </form>
          ) : (
            <p>Sie sind als {actor.email} angemeldet. Diese Einladung gilt für {preview.email}.</p>
          )}
        </div>
      ) : (
        <div className="card">
          <h2>Zugang anlegen</h2>
          <form action={registerViaInvitationAction.bind(null, token)} className="stack">
            <label>Name<input name="name" required autoComplete="name" /></label>
            <label>Passwort <small>mind. 10 Zeichen</small><input name="password" type="password" minLength={10} required autoComplete="new-password" /></label>
            <div><button type="submit">Konto anlegen und beitreten</button></div>
          </form>
          <p className="muted">
            Sie haben bereits ein Konto? <Link href={`/login?next=/invite/${token}`}>Anmelden</Link> und danach annehmen.
          </p>
        </div>
      )}
    </main>
  );
}
