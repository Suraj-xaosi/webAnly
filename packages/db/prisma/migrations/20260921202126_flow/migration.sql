-- AlterTable
ALTER TABLE "page_visit" ADD COLUMN     "previousPage" TEXT;

-- CreateIndex
CREATE INDEX "page_visit_domainId_previousPage_visitedAt_idx" ON "page_visit"("domainId", "previousPage", "visitedAt");

-- CreateIndex
CREATE INDEX "page_visit_domainId_page_visitedAt_idx" ON "page_visit"("domainId", "page", "visitedAt");
