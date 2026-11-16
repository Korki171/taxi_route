-- Stornoregeln als Freitext zwischen den Unternehmen: die feste Regel (Frist, Prozent) und die
-- berechnete Gebühr entfallen. Transferborsa rechnet keine Gebühren mehr aus, sondern dokumentiert nur.

ALTER TABLE "TransferRequest" DROP COLUMN "freeCancelHours",
DROP COLUMN "lateCancelPercent";

ALTER TABLE "Booking" DROP COLUMN "freeCancelHours",
DROP COLUMN "lateCancelPercent",
DROP COLUMN "feeCents";
