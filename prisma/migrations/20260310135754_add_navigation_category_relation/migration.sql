-- AlterTable
ALTER TABLE "AssetCategory" ADD COLUMN     "navigationId" TEXT;

-- CreateIndex
CREATE INDEX "AssetCategory_navigationId_idx" ON "AssetCategory"("navigationId");

-- AddForeignKey
ALTER TABLE "AssetCategory" ADD CONSTRAINT "AssetCategory_navigationId_fkey" FOREIGN KEY ("navigationId") REFERENCES "TopNav"("id") ON DELETE SET NULL ON UPDATE CASCADE;
