# AnimoSaaS - 多租户私域素材管理平台

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/leoyangx/AnimoSaaS)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-71%20passed-brightgreen.svg)]()

AnimoSaaS 是一款面向培训机构、动画工作室和个人讲师的**多租户私域素材分发平台**。支持一键部署、租户隔离、API 开放接口，帮助 B 端用户快速搭建品牌素材站。

## 核心特性

**多租户架构**

- 租户级数据完全隔离（子域名 / 路径 / Header 三种识别模式）
- 租户配额管理（用户数、资产数、存储空间）
- 超级管理员平台：租户 CRUD、系统监控、告警

**API 开放平台**

- RESTful API (`/api/v1/*`)，支持素材查询、下载、分类浏览
- API Key 认证（`ak_` 前缀 + SHA-256 哈希存储）
- 细粒度权限控制（8 种权限 + 通配符支持）

**存储引擎解耦**

- 内置 AList、123 云盘、聚合网盘适配器
- 自动探测真实下载地址和缩略图
- 支持直链下载和服务端代理两种模式

**企业级安全**

- JWT + HTTP-Only Cookie 认证
- Zod 运行时输入验证
- 速率限制、CSRF 防护
- bcrypt 12 rounds 密码哈希

**生产就绪**

- Docker 一键部署（预构建镜像 + 本地构建双模式，自动安装 Docker）
- CI/CD 流水线（GitHub Actions：lint / test / build / docker / e2e）
- 结构化日志 + 系统监控 + 告警规则
- 71 个单元测试 + E2E 测试

## 技术栈

| 层级  | 技术                                 |
| --- | ---------------------------------- |
| 框架  | Next.js 15 (App Router) + React 19 |
| 语言  | TypeScript 5.7 (strict mode)       |
| 样式  | Tailwind CSS 4 + Motion            |
| 数据库 | PostgreSQL 15 + Prisma 6.4         |
| 认证  | JWT + bcryptjs                     |
| 验证  | Zod                                |
| 测试  | Vitest + Playwright                |
| 部署  | Docker (GHCR 预构建镜像) + GitHub Actions |

## 快速开始

### 一键安装（推荐）

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/leoyangx/AnimoSaaS/main/animosaas)
```

一条命令自动完成：检测并安装 Docker → 克隆仓库 → 安装向导 → 拉取镜像部署 → 进入管理面板。

> 默认安装到 `/opt/animosaas`，可通过环境变量自定义：
>
> ```bash
> ANIMOSAAS_INSTALL_DIR=~/animosaas bash <(curl -fsSL https://raw.githubusercontent.com/leoyangx/AnimoSaaS/main/animosaas)
> ```

### 手动安装

```bash
git clone https://github.com/leoyangx/AnimoSaaS.git
cd AnimoSaaS
chmod +x animosaas
./animosaas
```

首次运行自动进入安装向导，完成后自动进入管理面板。

### 构建模式

默认使用预构建 Docker 镜像（`ghcr.io/leoyangx/animosaas:latest`），拉取速度快。如需从源码本地构建：

```bash
./animosaas --build-local
```

或直接使用 Docker Compose 覆盖文件：

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml build
docker compose up -d
```

### 部署完成后

访问地址（以你配置的域名和端口为准）：

- 前台：`http://your-domain:port`
- 管理后台：`http://your-domain:port/admin`
- 超级管理员：`http://your-domain:port/superadmin`
- 健康检查：`http://your-domain:port/api/health`

### 管理面板

部署完成后随时运行 `./animosaas` 进入交互式管理面板：

```
 1. 查看当前版本 & 检查更新    8. 修改应用域名
 2. 启动服务                   9. 修改超级管理员密码
 3. 停止服务                  10. 自动申请 HTTPS 证书
 4. 重启服务                  11. 备份数据库
 5. 查看实时日志              12. 恢复数据库备份
 6. 查看服务状态              13. 一键升级项目
 7. 修改应用端口              14. 重新安装
                              15. 重置系统
```

也支持 CLI 快捷命令：

```bash
./animosaas install     # 重新运行安装向导
./animosaas logs        # 实时查看日志
./animosaas status      # 查看服务状态
./animosaas upgrade     # 一键升级
./animosaas backup      # 备份数据库
./animosaas --build-local  # 本地构建模式
./animosaas help        # 查看所有命令
```

### 本地开发

```bash
npm install
cp .env.example .env
# 编辑 .env，设置 DATABASE_URL 和 JWT_SECRET

npx prisma db push                          # 同步数据库 Schema
npx tsx scripts/migrate-to-multitenant.ts    # 初始化多租户数据
npm run dev                                  # 启动开发服务器
```

详细说明请参考 [快速开始指南](docs/QUICK_START.md)。

## 项目结构

```
animosaas/
├── app/                    # Next.js App Router
│   ├── api/                # API 路由（43 个端点）
│   │   ├── v1/             # 开放 API（素材、分类、下载）
│   │   ├── admin/          # 管理后台 API
│   │   ├── superadmin/     # 超级管理员 API
│   │   └── health/         # 健康检查
│   ├── admin/              # 管理后台页面
│   ├── superadmin/         # 超级管理员页面
│   └── ...                 # 前台页面
├── components/             # 通用 UI 组件（15 个）
├── hooks/                  # React Hooks
├── lib/                    # 核心库
│   ├── tenant.ts           # 租户识别（带缓存）
│   ├── tenant-context.ts   # 租户上下文
│   ├── api-keys.ts         # API Key 管理
│   ├── cache.ts            # 内存缓存（LRU + 请求去重）
│   ├── logger.ts           # 结构化日志
│   ├── alerts.ts           # 告警规则引擎
│   └── ...
├── prisma/                 # 数据库（18 个模型）
├── tests/                  # 测试（71 个用例）
├── scripts/                # 运行时脚本（入口点、迁移）
├── .github/workflows/      # CI/CD 流水线
├── Dockerfile              # 多阶段构建（本地构建模式）
├── docker-compose.yml      # 编排配置（默认拉取预构建镜像）
└── docker-compose.build.yml # 本地构建覆盖文件
```

## 文档

| 文档                               | 说明                                     |
| -------------------------------- | -------------------------------------- |
| [快速开始](docs/QUICK_START.md)      | 5 分钟完成环境搭建                             |
| [部署指南](docs/DEPLOYMENT.md)       | Docker / 手动部署 / Nginx / SSL            |
| [开发指南](docs/DEVELOPMENT.md)      | 本地开发 / 代码规范 / 架构说明                     |
| [API 文档](docs/API.md)            | V1 开放 API / Admin API / SuperAdmin API |
| [数据库迁移](docs/MIGRATION_GUIDE.md) | 迁移流程 / 多租户初始化                          |
| [安全策略](docs/SECURITY.md)         | 安全措施 / 漏洞报告                            |
| [贡献指南](docs/CONTRIBUTING.md)     | 开发规范 / PR 流程                           |
| [更新日志](docs/CHANGELOG.md)        | 版本历史                                   |

## 架构概览

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (反向代理)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Middleware  │
                    │  租户识别    │
                    │  API Key 认证│
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │  前台页面    │  │  管理后台    │  │  超级管理员  │
   │  (SSR/CSR)  │  │  (CSR)      │  │  (CSR)      │
   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Prisma    │
                    │  + 缓存层   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │ (tenantId)  │
                    └─────────────┘
```

## 项目统计

| 指标        | 数值      |
| --------- | ------- |
| 源代码文件     | 127     |
| 代码行数      | 14,000+ |
| API 端点    | 43      |
| 数据库模型     | 18      |
| UI 组件     | 15      |
| 测试用例      | 71      |
| CI/CD 工作流 | 4       |

## 路线图

### v1.0.1（计划中）

- [ ] Redis 缓存层
- [ ] WebSocket 实时通知
- [ ] 国际化支持（i18n）
- [ ] Swagger API 文档自动生成

### v1.0.2（计划中）

- [ ] CDN 集成
- [ ] 全文搜索（Elasticsearch）
- [ ] 邮件通知系统
- [ ] 租户自助注册

## 开源协议

[MIT License](LICENSE) - 完全免费，允许商用及二次修改。

## 致谢

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

---

**AnimoSaaS** - 多租户私域素材管理平台
