-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "reportPublishedAt" TIMESTAMP(3),
ADD COLUMN "reportShareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_reportShareToken_key" ON "Organization"("reportShareToken");
