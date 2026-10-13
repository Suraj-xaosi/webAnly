ALTER TABLE "payment" ADD COLUMN "pendingDomainId" TEXT;

WITH ranked_pending AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "domainId" ORDER BY "createdAt" DESC, "id" DESC) AS row_number
  FROM "payment"
  WHERE "status" = 'PENDING'
)
UPDATE "payment"
SET "pendingDomainId" = "payment"."domainId"
FROM ranked_pending
WHERE "payment"."id" = ranked_pending."id"
  AND ranked_pending.row_number = 1;

CREATE UNIQUE INDEX "payment_pendingDomainId_key" ON "payment"("pendingDomainId");
