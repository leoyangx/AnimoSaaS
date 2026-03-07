# Changelog

基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 格式。

## [1.0.1] - 2026-03-07

部署健壮性深度重构，实现零配置偏差的自动化部署。

### 修复

- **[致命] `lib/auth.ts` 模块级 throw**：JWT\_SECRET 改为延迟初始化函数 `getJwtSecret()`，构建阶段 import 不再崩溃
- **[致命] Dockerfile 构建缺少环境变量**：builder 阶段添加 `JWT_SECRET` / `DATABASE_URL` / `TENANT_MODE` 占位值
- **[致命] Docker 容器 `prisma: not found`**：standalone 产物中 `npx` 不可用，改为 `node ./node_modules/prisma/build/index.js` 直接调用，并添加多路径自动探测
- **[高] `docker-entrypoint.sh` 迁移命令失败**：项目无 `prisma/migrations/` 目录导致 `migrate deploy` 必定失败，改为 `prisma db push --skip-generate`
- **[高] CI `Lint & Type Check` 失败**：所有 CI job 添加全局占位环境变量
- **[高] E2E 测试连接失败**：CI 中构建后未启动 `next start`，添加后台启动 + 健康检查等待逻辑
- **[中] `docker-compose.yml` 健康检查不一致**：app 容器健康检查从 `node -e` 统一为 `curl`（与 Dockerfile 一致）
- **[中] `deploy.sh` 验证过于死板**：`DB_PASSWORD` 缺失改为警告而非阻断；`.env` 解析改用逐行安全解析替代 `source`

### 变更

- **Dockerfile prisma 版本管理**：去掉 `npm install -g prisma@6.4.1` 硬编码，改为从 builder 阶段复制 `node_modules/prisma`
- **`deploy.sh` 增强**：新增磁盘空间检查、架构信息输出、Docker 守护进程友好错误提示
- **删除 `entrypoint.sh`（根目录）**：已被 `scripts/docker-entrypoint.sh` 替代

## [1.0.1] - 2026-03-07

从单租户 MVP 全面升级为生产级多租户 SaaS 平台。

### 新增

**Phase 1 - 数据库架构升级**

- 多租户数据模型：Tenant、TenantQuota、SuperAdmin
- 所有业务表添加 `tenantId` 字段和外键
- 数据库索引优化和软删除支持

**Phase 2 - 租户隔离层**

- 三种租户识别模式：子域名、路径、Header
- 租户中间件自动注入 `X-Tenant-Id` / `X-Tenant-Slug`
- 内存缓存租户信息（1 分钟 TTL）
- 租户配额管理（用户数、资产数、存储空间）

**Phase 3 - 超级管理员系统**

- 独立的超级管理员认证体系
- 租户 CRUD 管理面板
- 租户详情页（配额可视化、管理员列表、操作日志）
- 超级管理员仪表板

**Phase 4 - API Key 管理**

- API Key 生成（`ak_` 前缀 + 32 字节随机 + SHA-256 哈希存储）
- 8 种细粒度权限（`assets:read/write/delete`、`categories:read/write`、`users:read`、`download:read`、`logs:read`）
- 通配符权限支持（`*`、`assets:*`）
- V1 RESTful API：素材查询、详情、下载、分类
- API Key 管理后台 UI

**Phase 5 - 一键部署**

- Docker 多阶段构建 + standalone 输出
- `docker-entrypoint.sh` 自动迁移启动
- `deploy.sh` 一键部署脚本
- 健康检查端点（`/api/health`、`/api/health/ready`）

**Phase 6 - 测试系统**

- Vitest 单元测试框架（71 个测试用例）
- Playwright E2E 测试框架
- 测试覆盖：API Key、API 响应、租户识别、配额管理、健康检查、V1 API、超管认证

**Phase 7 - CI/CD 流水线**

- GitHub Actions：lint → test → build → docker
- E2E 测试工作流
- Docker 镜像自动发布（GHCR）
- Release 自动 changelog
- Dependabot 依赖更新

**Phase 8 - 监控与告警**

- 结构化日志系统（`lib/logger.ts`）
- 5 条告警规则：内存、错误率、数据库、配额、停用租户
- 系统监控仪表板（15 秒自动刷新）
- 请求统计（状态分布、TopPaths、错误率）

**Phase 9 - UI 优化**

- 通用组件库：Badge、PageHeader、ConfirmDialog、LoadingSpinner、EmptyState
- 移动端响应式适配（MobileSidebar、table-responsive）
- 错误页面：404、Error、Suspended、Loading
- 管理后台 header/table 响应式布局

**Phase 10 - 性能优化**

- Next.js Image 优化（sizes、lazy loading、avif/webp）
- Recharts 动态导入（减少首屏 bundle）
- 通用内存缓存（LRU + 请求去重）
- 数据库查询缓存（config 5min、categories 10min）
- `optimizePackageImports` 优化 lucide-react / motion
- Web Vitals 监控工具
- 虚拟滚动 / 无限滚动 Hook

### 统计

| 指标        | 数值      |
| --------- | ------- |
| 源代码文件     | 127     |
| 代码行数      | 14,000+ |
| API 端点    | 43      |
| 数据库模型     | 18      |
| UI 组件     | 15      |
| 测试用例      | 71      |
| CI/CD 工作流 | 4       |

## [1.0.0] - 2026-02

安全加固和架构优化。

### 新增

- Zod 运行时输入验证
- 速率限制和 CSRF 防护
- 文件上传验证
- 统一 API 响应格式
- ErrorBoundary 和 Skeleton 组件
- 数据库索引和软删除
- 强密码策略

## [1.0.0] - 2025-12

初始发布：单租户素材管理系统。
