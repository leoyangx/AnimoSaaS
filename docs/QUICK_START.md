# 快速开始

5 分钟完成 AnimoSaaS 环境搭建与项目启动。

## 环境要求

- Node.js 20+
- PostgreSQL 15+（或使用 Docker）
- npm 9+

## 方式一：Docker 一键部署（推荐）

```bash
git clone https://github.com/leoyangx/AnimoSaaS.git
cd AnimoSaaS
bash scripts/deploy.sh
```

脚本会自动：
1. 生成 `.env` 文件（含随机 JWT_SECRET 和数据库密码）
2. 启动 PostgreSQL 和应用容器
3. 执行数据库迁移
4. 初始化默认租户和超级管理员
5. 等待健康检查通过

部署完成后访问：

| 地址 | 说明 |
|------|------|
| `http://localhost:3000` | 前台首页 |
| `http://localhost:3000/admin/login` | 管理后台 |
| `http://localhost:3000/superadmin/login` | 超级管理员 |
| `http://localhost:3000/api/health` | 健康检查 |
| `http://localhost:3000/api/health/ready` | 就绪检查 |

## 方式二：本地开发

### 1. 克隆并安装依赖

```bash
git clone https://github.com/leoyangx/AnimoSaaS.git
cd AnimoSaaS
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，确保以下关键配置：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/animosaas"
JWT_SECRET="your-random-secret-at-least-32-chars"
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="your-secure-password"
```

### 3. 启动数据库

```bash
docker-compose up -d db
```

### 4. 初始化数据库

```bash
npx prisma migrate dev
npx tsx scripts/init-multi-tenant.ts
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`。

## 初始账号

| 角色 | 登录地址 | 默认账号 |
|------|---------|---------|
| 超级管理员 | `/superadmin/login` | `.env` 中的 `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` |
| 租户管理员 | `/admin/login` | 通过超级管理员创建 |
| 普通用户 | `/login` | 通过邀请码注册 |

## 常用命令

```bash
npm run dev            # 启动开发服务器
npm run build          # 构建生产版本
npm run start          # 启动生产服务器
npm test               # 运行单元测试
npm run test:watch     # 监听模式测试
npm run test:coverage  # 测试覆盖率
npm run test:e2e       # E2E 测试
npm run lint           # 代码检查
```

## 下一步

- [部署指南](DEPLOYMENT.md) - 生产环境部署
- [开发指南](DEVELOPMENT.md) - 开发工作流
- [API 文档](API.md) - 接口说明
