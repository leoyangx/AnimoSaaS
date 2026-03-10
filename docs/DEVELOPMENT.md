# 开发指南

## 技术栈

| 技术         | 版本 | 用途                |
| ------------ | ---- | ------------------- |
| Next.js      | 15   | App Router 全栈框架 |
| React        | 19   | UI 库               |
| TypeScript   | 5.7  | 类型安全            |
| Tailwind CSS | 4    | 样式                |
| Motion       | 12   | 动画                |
| Prisma       | 6.4  | ORM                 |
| PostgreSQL   | 15   | 数据库              |
| Zod          | 4.3  | 运行时验证          |
| Vitest       | 4    | 单元测试            |
| Playwright   | -    | E2E 测试            |

## 项目结构

```
app/
├── api/
│   ├── v1/              # 开放 API（API Key 认证）
│   │   ├── assets/      # 素材查询、详情、下载
│   │   └── categories/  # 分类列表
│   ├── admin/           # 管理后台 API（JWT 认证）
│   │   ├── assets/      # 素材 CRUD
│   │   ├── users/       # 用户管理
│   │   ├── codes/       # 邀请码
│   │   └── api-keys/    # API Key 管理
│   ├── superadmin/      # 超级管理员 API（JWT 认证）
│   │   ├── tenants/     # 租户 CRUD
│   │   ├── monitoring/  # 系统监控
│   │   └── alerts/      # 告警
│   └── health/          # 健康检查
├── admin/               # 管理后台页面
├── superadmin/          # 超级管理员页面
└── (前台页面)

components/              # 通用 UI 组件
├── Badge.tsx            # 状态徽章
├── PageHeader.tsx       # 页头
├── ConfirmDialog.tsx    # 确认弹窗 + useConfirm hook
├── LoadingSpinner.tsx   # 加载动画
├── EmptyState.tsx       # 空状态
├── MobileSidebar.tsx    # 移动端侧边栏
├── LazyCharts.tsx       # 图表懒加载
└── ...

hooks/
└── useVirtualList.ts    # 虚拟滚动 / 无限滚动 / 懒加载 Hook

lib/
├── prisma.ts            # Prisma 客户端（单例）
├── db.ts                # 数据库操作层（带缓存）
├── auth.ts              # JWT 认证
├── tenant.ts            # 租户识别（带内存缓存）
├── tenant-context.ts    # 请求级租户上下文
├── api-keys.ts          # API Key 生成、验证、权限检查
├── cache.ts             # 通用内存缓存（LRU + 请求去重）
├── logger.ts            # 结构化日志
├── alerts.ts            # 告警规则引擎
├── quota.ts             # 租户配额检查
├── rate-limit.ts        # 速率限制
├── storage.ts           # 存储引擎适配器
├── api-response.ts      # 统一 API 响应格式
├── types.ts             # 全局类型定义
└── utils.ts             # 工具函数

tests/
├── lib/                 # 库函数单元测试
├── api/                 # API 逻辑测试
└── e2e/                 # E2E 测试
```

## 开发工作流

### 启动开发环境

```bash
docker-compose up -d db   # 启动数据库
npm run dev               # 启动开发服务器（热更新）
```

### 数据库操作

```bash
npx prisma migrate dev    # 创建和应用迁移
npx prisma studio         # 可视化数据库管理
npx prisma generate       # 重新生成 Prisma Client
npx prisma db push        # 快速同步 schema（开发用）
```

### 代码规范

项目使用 ESLint + Prettier + Husky：

```bash
npm run lint              # 运行 ESLint
npx prettier --check .    # 检查格式
```

Git commit 时自动运行 lint-staged。

### 测试

```bash
npm test                  # 运行所有单元测试
npm run test:watch        # 监听模式
npm run test:coverage     # 覆盖率报告
npm run test:e2e          # Playwright E2E 测试
```

## 核心概念

### 多租户隔离

所有数据查询必须包含 `tenantId` 过滤：

```typescript
// Server Component
import { getTenantId } from '@/lib/tenant-context';

const tenantId = await getTenantId();
const assets = await db.assets.getAll(tenantId);

// API Route
import { getTenantIdFromRequest } from '@/lib/tenant-context';

const tenantId = getTenantIdFromRequest(request);
```

### API Key 认证

V1 API 使用 Bearer Token 认证：

```typescript
// 客户端请求
fetch('/api/v1/assets', {
  headers: { Authorization: 'Bearer ak_xxxxxxxx...' },
});

// 中间件自动注入以下 header
// x-tenant-id, x-tenant-slug, x-api-key-id, x-api-key-permissions
```

### 缓存策略

`lib/cache.ts` 提供 `MemoryCache` 类：

```typescript
import { configCache } from '@/lib/cache';

// 自动缓存 + 请求去重
const config = await configCache.getOrSet(
  `config:${tenantId}`,
  () => prisma.siteConfig.findUnique({ where: { tenantId } }),
  5 * 60 * 1000 // 5 分钟 TTL
);

// 写操作后失效缓存
configCache.delete(`config:${tenantId}`);
```

### 日志

```typescript
import { createLogger } from '@/lib/logger';

const log = createLogger('my-module');
log.info('操作完成', { userId, action });
log.error('操作失败', { error: err.message });
```

开发环境输出可读格式，生产环境输出 JSON。

### 统一 API 响应

```typescript
import { apiSuccess, apiError, apiPaginated } from '@/lib/api-response';

// 成功
return apiSuccess(data);

// 分页
return apiPaginated(items, { page, limit, total });

// 错误
return apiError('未找到', 404);
```

## Next.js 15 注意事项

- `params` 和 `searchParams` 是 `Promise` 类型，需要 `await`
- Middleware 中使用 Prisma 需要 `export const runtime = 'nodejs'`
- App Router 不支持传统的 `getServerSideProps`

## 添加新功能的流程

1. 在 `prisma/schema.prisma` 添加模型（如需要）
2. 运行 `npx prisma migrate dev --name feature_name`
3. 在 `lib/db.ts` 添加数据库操作方法
4. 在 `app/api/` 添加 API 路由
5. 在 `app/` 添加页面
6. 在 `tests/` 添加测试
7. 确保所有查询包含 `tenantId` 过滤
