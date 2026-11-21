DROP TABLE IF EXISTS "payment";

ALTER TABLE "domain" DROP COLUMN IF EXISTS "type";
DROP TYPE IF EXISTS "DomainType";

DROP TABLE IF EXISTS "pricing_config";
DROP TYPE IF EXISTS "PaymentPurpose";
DROP TYPE IF EXISTS "PaymentStatus";

CREATE TYPE "NotificationType_new" AS ENUM ('SPIKE_ALERT', 'DOMAIN_EXPIRING', 'DOMAIN_EXPIRED', 'SYSTEM');

ALTER TABLE "notification"
  ALTER COLUMN "type" TYPE "NotificationType_new"
  USING (
    CASE
      WHEN "type"::text = 'BILLING' THEN 'SYSTEM'
      ELSE "type"::text
    END
  )::"NotificationType_new";

DROP TYPE "NotificationType";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
