# 数据库迁移指南

## 迁移工具

AnimoSaaS 使用 Prisma Migrate 管理数据库 schema。

## 开发环境

```bash
# 创建并应用新迁移
npx prisma migrate dev --name migration_name

# 快速同步（不创建迁移文件，仅开发用）
npx prisma db push

# 重置数据库（删除所有数据）
npx prisma migrate reset
```

## 生产环境

```bash
# 应用所有待执行的迁移
npx prisma migrate deploy
```

Docker 容器启动时自动执行 `prisma migrate deploy`。

## 多租户初始化

首次部署或迁移后，运行初始化脚本：

```bash
npx tsx scripts/init-multi-tenant.ts
```

该脚本幂等执行以下操作：
1. 创建默认租户（slug: `default`）
2. 创建超级管理员（使用 `.env` 中的 `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`）
3. 创建默认租户的配额记录
4. 创建默认站点配置

## 数据库模型

AnimoSaaS v3.0 包含 18 个数据库模型：

| 模型 | 说明 |
|------|------|
| `Tenant` | 租户 |
| `TenantQuota` | 租户配额 |
| `SuperAdmin` | 超级管理员 |
| `ApiKey` | API 密钥 |
| `Permission` | 权限定义 |
| `RolePermission` | 角色权限关联 |
| `SystemSettings` | 系统设置 |
| `StorageSettings` | 存储设置 |
| `SecuritySettings` | 安全设置 |
| `Navigation` | 导航配置 |
| `TopNav` | 顶部导航 |
| `AssetCategory` | 素材分类 |
| `Asset` | 素材 |
| `DownloadLog` | 下载日志 |
| `User` | 用户 |
| `InvitationCode` | 邀请码 |
| `SiteConfig` | 站点配置 |
| `AdminLog` | 管理日志 |

所有业务数据模型通过 `tenantId` 字段实现租户隔离。

## 常见问题

### 迁移失败

```bash
# 查看迁移状态
npx prisma migrate status

# 如果有未解决的迁移，标记为已应用
npx prisma migrate resolve --applied migration_name
```

### Schema 与数据库不一致

```bash
# 使用 db push 强制同步（仅开发环境）
npx prisma db push --force-reset

# 或创建新迁移修复差异
npx prisma migrate dev
```

### 连接池优化

在 `DATABASE_URL` 中添加连接池参数：

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30"
```
