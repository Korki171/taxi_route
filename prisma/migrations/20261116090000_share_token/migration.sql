-- Teilen-Link je Auftrag (/a/…), z. B. für WhatsApp-Gruppen. Bestehende Aufträge erhalten einen eigenen Schlüssel.
ALTER TABLE "TransferRequest" ADD COLUMN "shareToken" TEXT NOT NULL DEFAULT replace((gen_random_uuid())::text, '-'::text, ''::text);

-- CreateIndex
CREATE UNIQUE INDEX "TransferRequest_shareToken_key" ON "TransferRequest"("shareToken");
