-- CreateTable
CREATE TABLE "PageHidden" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "hiddenAt" TIMESTAMP(3) NOT NULL,
    "hiddenFor" INTEGER NOT NULL,

    CONSTRAINT "PageHidden_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageHidden_domainId_hiddenAt_idx" ON "PageHidden"("domainId", "hiddenAt");

-- CreateIndex
CREATE INDEX "PageHidden_domainId_page_idx" ON "PageHidden"("domainId", "page");

-- AddForeignKey
ALTER TABLE "PageHidden" ADD CONSTRAINT "PageHidden_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
