-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "copyrightLabel" TEXT,
ADD COLUMN     "copyrightType" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "downloadMethod" TEXT NOT NULL DEFAULT 'direct',
ADD COLUMN     "downloadPermission" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "permissionLevel" TEXT,
ADD COLUMN     "showCreatedTime" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SiteConfig" ADD COLUMN     "assetDefaultSort" TEXT DEFAULT 'sortOrder',
ADD COLUMN     "assetDisplayColumns" TEXT DEFAULT '[]',
ADD COLUMN     "assetPageSize" INTEGER DEFAULT 10;

-- AlterTable
ALTER TABLE "TopNav" ADD COLUMN     "description" TEXT,
ADD COLUMN     "templateType" TEXT NOT NULL DEFAULT 'custom';

-- CreateIndex
CREATE INDEX "Asset_sortOrder_idx" ON "Asset"("sortOrder");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "TopNav_order_idx" ON "TopNav"("order");
