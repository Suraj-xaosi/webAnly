CREATE TABLE "web_socket_ticket" (
    "tokenHash" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_socket_ticket_pkey" PRIMARY KEY ("tokenHash")
);

CREATE INDEX "web_socket_ticket_expiresAt_idx" ON "web_socket_ticket"("expiresAt");

ALTER TABLE "web_socket_ticket"
ADD CONSTRAINT "web_socket_ticket_domainId_fkey"
FOREIGN KEY ("domainId") REFERENCES "domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_token_usage" (
    "domainId" TEXT NOT NULL,
    "usageDate" DATE NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_token_usage_pkey" PRIMARY KEY ("domainId", "usageDate")
);

ALTER TABLE "ai_token_usage"
ADD CONSTRAINT "ai_token_usage_domainId_fkey"
FOREIGN KEY ("domainId") REFERENCES "domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
