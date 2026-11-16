-- Standardfrist des Betriebs für die automatische Weitergabe (Minuten, NULL = nicht automatisch)
ALTER TABLE "Organization" ADD COLUMN "escalateDefaultMinutes" INTEGER DEFAULT 30;
