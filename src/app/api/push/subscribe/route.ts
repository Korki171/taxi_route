import { AppError } from "@/server/errors";
import { removePushSubscription, savePushSubscription } from "@/server/services/push";
import { getActor, getSession } from "@/server/web";

function fail(e: unknown) {
  if (e instanceof AppError) {
    const status = e.code === "UNAUTHENTICATED" ? 401 : e.code === "FORBIDDEN" ? 403 : 400;
    return Response.json({ error: e.message }, { status });
  }
  throw e;
}

/** Schaltet Mitteilungen für dieses Gerät ein. */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    await savePushSubscription(await getActor(), session?.id ?? null, await req.json().catch(() => null));
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

/** Schaltet Mitteilungen für dieses Gerät aus. */
export async function DELETE(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { endpoint?: unknown } | null;
    await removePushSubscription(await getActor(), body?.endpoint);
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
