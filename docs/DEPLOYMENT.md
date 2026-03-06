# AnimoSaaS 部署指南 (Deployment Guide)

AnimoSaaS 支持多种部署方式，推荐使用 **Docker Compose** 进行私有化部署，或组合使用 **Vercel + 云数据库** 获得边缘加速体验。

---

## 方式一：使用 Docker Compose (推荐，最适合私有化)

该方式将同时启动应用程序和 PostgreSQL 数据库，适合部署在云服务器 (如阿里云、腾讯云) 或本地 NAS。

### 1. 准备环境配置

复制默认的环境变量文件，并填入您的安全密钥：

```bash
cp .env.example .env
```

确保在 `.env` 中修改以下核心配置：

- `ADMIN_PASSWORD`: 系统初始管理员密码 (必改，首次启动有效)
- `JWT_SECRET`: 用于签发认证 Token 的随机长字符串 (必填)

### 2. 构建并启动容器

在项目根目录运行以下命令：

```bash
docker-compose up -d --build
```

此命令将：

1. 启动 PostgreSQL 数据库，仅监听内部端口。
2. 自动运行 `npx prisma db push` 初始化数据表结构。
3. 启动 AnimoSaaS Node.js 服务。

### 3. 访问系统

启动成功后，访问 `http://你的服务器IP:3000` 即可看到前端页面。
访问 `http://你的服务器IP:3000/admin/login` 并使用以下默认账号登录：

- **邮箱**: admin@animosaas.local
- **密码**: (您在 .env 文件中填写的 `ADMIN_PASSWORD`)

---

## 方式二：使用 Vercel + 云端 PostgreSQL 部署

如果您只希望部署前端/应用层，并将数据库交由云服务商管理（例如 Supabase, Railway, Neon），请按以下步骤操作：

### 1. 准备云数据库

1. 在 [Supabase](https://supabase.com/) 或任意支持 PostgreSQL 的服务商处申请一个免费数据库。
2. 获取 `DATABASE_URL` (连接字符串格式)。

### 2. Vercel 部署

1. Fork 本项目到您的 GitHub。
2. 在 Vercel 面板中导入代码库。
3. 在 **Environment Variables** 环节，填入以下必填项：
   - `DATABASE_URL`: 您的云数据库连接URL
   - `JWT_SECRET`: 自己随机生成的一长段字符
   - `ADMIN_PASSWORD`: 您希望的初始管理员密码
4. 点击 Deploy 即可。

如果部署报错缺少数据库表结构，您可以在您的开发机上本地执行以下命令将表结构推送到云端：

```bash
npx prisma db push
```

---

## 安全与生产建议

- **Nginx 反代与 SSL**: 如果使用 Docker 部署，请务必在前方配置 Nginx 代理，并申请 HTTPS 证书。
- **防火墙配置**: 如果服务器有公网 IP，请确保防火墙（如 ufw / 阿里云安全组）禁止外部直接访问 `5432` 端口，只开放 `80` 和 `443`。
- **强制 HTTPS**: 生产环境下强烈建议开启 `DISABLE_SECURE_COOKIE=false` (只需不在外部传入该变量即可，代码默认非开发环境为 true)。
