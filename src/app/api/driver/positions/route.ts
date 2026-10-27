import { AppError } from "@/server/errors";
import { recordPositions } from "@/server/services/driver";
import { getActor } from "@/server/web";

/** Positionen aus der Fahrer-Ansicht (JSON-Array von Messpunkten, siehe recordPositions). */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  try {
    return Response.json(await recordPositions(await getActor(), body), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof AppError) {
      const status = e.code === "UNAUTHENTICATED" ? 401 : e.code === "FORBIDDEN" ? 403 : e.code === "VALIDATION" ? 409 : 404;
      return Response.json({ error: e.message, code: e.code }, { status });
    }
    throw e;
  }
}
