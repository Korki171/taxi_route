-- Ablaufwarnung für Nachweise: 0 = keine, 1 = Hinweis 30 Tage vorher gesendet, 2 = Hinweis zum Ablauf gesendet.
ALTER TABLE "VerificationDocument" ADD COLUMN "expiryNotice" INTEGER NOT NULL DEFAULT 0;
