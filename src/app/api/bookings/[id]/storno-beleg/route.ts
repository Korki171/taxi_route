import { isCancelClosed } from "@/lib/cancellation";
import { AppError } from "@/server/errors";
import { getI18n } from "@/server/i18n";
import { renderConfirmationPdf } from "@/server/pdf/confirmation";
import { bookingReference, getBookingConfirmation } from "@/server/services/confirmation";
import { getActor } from "@/server/web";

/** Storno-Beleg als PDF für stornierte Buchungen und No-Shows, nur für die beiden beteiligten Unternehmen. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await getBookingConfirmation(await getActor(), id);
    if (!isCancelClosed(data.booking.status)) return new Response("Nicht gefunden", { status: 404 });
    const { locale, t } = await getI18n();
    const pdf = await renderConfirmationPdf(data, locale, "cancellation");
    const name = `${t("Storno-Beleg")}-${bookingReference(data.request.number)}.pdf`;
    const disposition = new URL(req.url).searchParams.has("download") ? "attachment" : "inline";
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${name}"`,
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
