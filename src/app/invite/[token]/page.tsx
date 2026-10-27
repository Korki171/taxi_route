import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { Flash, type SP } from "@/components/ui";
import { ORG_TYPE_LABEL, ROLE_LABEL } from "@/lib/labels";
import { AppError } from "@/server/errors";
import { getInvitationPreview } from "@/server/services/members";
import { getActor } from "@/server/web";
import { acceptInvitationAction, registerViaInvitationAction } from "../../actions";
import { getI18n } from "@/server/i18n";

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: SP }) {
  const { t } = await getI18n();
  const { token } = await params;
  const sp = await searchParams;
  let preview;
  try {
    preview = await getInvitationPreview(token);
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    return (
      <AuthLayout path={`/invite/${token}`}>
        <h1>{t("Einladung")}</h1>
        <div className="flash error">{t(e.message)}</div>
        <Link href="/login">{t("Zur Anmeldung")}</Link>
      </AuthLayout>
    );
  }
  const actor = await getActor();

  return (
    <AuthLayout path={`/invite/${token}`}>
      <h1>{t("Einladung zu {org}", { org: preview.organization.name })}</h1>
      <p className="sub">
        {t(ORG_TYPE_LABEL[preview.organization.type])} · {t("Rolle")}: {t(ROLE_LABEL[preview.role])} · {t("für {email}", { email: preview.email })}
      </p>
      <Flash searchParams={sp} />
      {actor ? (
        actor.email === preview.email ? (
          <form action={acceptInvitationAction.bind(null, token)}>
            <button type="submit" className="accent">{t("Einladung annehmen")}</button>
          </form>
        ) : (
          <p>{t("Sie sind als {me} angemeldet. Diese Einladung gilt für {email}.", { me: actor.email, email: preview.email })}</p>
        )
      ) : (
        <>
          <h2>{t("Zugang anlegen")}</h2>
          <form action={registerViaInvitationAction.bind(null, token)} className="stack">
            <label>{t("Name")}<input name="name" required autoComplete="name" /></label>
            <label>{t("Passwort")}{" "}<small>{t("mind. 10 Zeichen")}</small><input name="password" type="password" minLength={10} required autoComplete="new-password" /></label>
            <div><button type="submit" className="accent">{t("Konto anlegen und beitreten")}</button></div>
          </form>
          <p className="auth-alt">
            {t("Sie haben bereits ein Konto?")}{" "}<Link href={`/login?next=/invite/${token}`}>{t("Anmelden")}</Link>{" "}{t("und danach annehmen.")}
          </p>
        </>
      )}
    </AuthLayout>
  );
}
