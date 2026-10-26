import { AppError } from "@/server/errors";
import { getDocumentForDownload } from "@/server/services/documents";
import { getActor } from "@/server/web";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const doc = await getDocumentForDownload(await getActor(), id);
    return new Response(new Uint8Array(doc.content), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    if (e instanceof AppError) {
      const status = e.code === "UNAUTHENTICATED" ? 401 : 404;
      return new Response(e.message, { status });
    }
    throw e;
  }
}
