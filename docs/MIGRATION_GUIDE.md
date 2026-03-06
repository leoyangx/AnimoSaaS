# 数据库迁移指南

## 问题说明

数据库迁移失败是因为数据库连接配置不正确。这是正常的，因为需要先配置数据库连接。

## 迁移步骤

### 1. 配置数据库连接

编辑 `.env` 文件，设置正确的数据库连接：

```bash
# 如果使用 Docker Compose（推荐）
DATABASE_URL="postgresql://animosaas:animosaas_pass@localhost:5432/animosaas_db"

# 或者使用你自己的 PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

### 2. 启动数据库（如果使用 Docker）

```bash
docker-compose up -d db
```

### 3. 运行数据库迁移

```bash
npx prisma migrate dev --name add_indexes_and_soft_delete
```

这将：

- 添加 9 个数据库索引
- 添加 3 个软删除字段（deletedAt）
- 不会删除任何现有数据

### 4. 生成 Prisma Client

```bash
npx prisma generate
```

### 5. 验证迁移

```bash
npx prisma studio
```

这将打开 Prisma Studio，你可以查看数据库结构。

## 如果数据库已有数据

如果你的数据库已经有数据，迁移是安全的：

- 新增的索引不会影响现有数据
- `deletedAt` 字段默认为 NULL，不影响现有记录
- 所有现有功能保持正常工作

## 回滚迁移（如果需要）

```bash
npx prisma migrate reset
```

⚠️ 警告：这将删除所有数据！仅在开发环境使用。

## 手动迁移（可选）

如果自动迁移失败，可以手动执行 SQL：

```sql
-- 添加软删除字段
ALTER TABLE "Asset" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "AssetCategory" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- 添加索引
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_disabled_idx" ON "User"("disabled");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");
CREATE INDEX "Asset_createdAt_idx" ON "Asset"("createdAt");
CREATE INDEX "Asset_downloadCount_idx" ON "Asset"("downloadCount");
CREATE INDEX "Asset_title_idx" ON "Asset"("title");
CREATE INDEX "Asset_deletedAt_idx" ON "Asset"("deletedAt");

CREATE INDEX "AssetCategory_parentId_idx" ON "AssetCategory"("parentId");
CREATE INDEX "AssetCategory_status_idx" ON "AssetCategory"("status");
CREATE INDEX "AssetCategory_deletedAt_idx" ON "AssetCategory"("deletedAt");

CREATE INDEX "DownloadLog_assetId_idx" ON "DownloadLog"("assetId");
CREATE INDEX "DownloadLog_userId_idx" ON "DownloadLog"("userId");
CREATE INDEX "DownloadLog_createdAt_idx" ON "DownloadLog"("createdAt");

CREATE INDEX "InvitationCode_status_idx" ON "InvitationCode"("status");
CREATE INDEX "InvitationCode_createdAt_idx" ON "InvitationCode"("createdAt");

CREATE INDEX "AdminLog_adminEmail_idx" ON "AdminLog"("adminEmail");
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");
CREATE INDEX "AdminLog_action_idx" ON "AdminLog"("action");
```

## 验证升级

运行以下命令验证所有依赖已安装：

```bash
npm list zod sharp
```

应该看到：

- zod@3.x.x
- sharp@0.34.x

## 常见问题

### Q: 迁移时提示 "P1000: Authentication failed"

A: 检查 DATABASE_URL 是否正确，确保数据库服务已启动。

### Q: 迁移时提示 "P3009: migrate found failed migrations"

A: 运行 `npx prisma migrate resolve --applied <migration_name>` 标记为已应用。

### Q: 如何查看当前迁移状态？

A: 运行 `npx prisma migrate status`

## 下一步

迁移完成后，继续执行：

1. 初始化管理员账号：访问 `http://localhost:3000/api/init`
2. 启动开发服务器：`npm run dev`
3. 测试所有功能
