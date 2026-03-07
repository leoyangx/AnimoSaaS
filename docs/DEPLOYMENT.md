# 部署指南

## Docker 部署（推荐）

### 一键部署

```bash
git clone https://github.com/leoyangx/AnimoSaaS.git
cd AnimoSaaS
bash deploy.sh
```

脚本自动完成：

1. 检查 Docker / Docker Compose / 磁盘空间
2. 生成 `.env`（含随机 JWT\_SECRET 和数据库密码）
3. 构建 Docker 镜像（多阶段构建，含构建阶段占位环境变量）
4. 启动 PostgreSQL + Next.js 容器
5. 等待健康检查通过

### 手动 Docker Compose

```bash
cp .env.example .env
# 编辑 .env，至少设置 JWT_SECRET（>= 32 字符）
docker compose up -d
```

### 环境变量说明

| 变量                     | 必填 | 说明                                          |
| ---------------------- | -- | ------------------------------------------- |
| `JWT_SECRET`           | 是  | JWT 签名密钥（>= 32 字符），`deploy.sh` 自动生成          |
| `DB_PASSWORD`          | 否  | 数据库密码，不设则使用 `docker-compose.yml` 中的默认值       |
| `ADMIN_PASSWORD`       | 否  | 初始管理员密码（>= 12 字符，含大小写和数字），不设则自动生成随机密码       |
| `SUPER_ADMIN_EMAIL`    | 否  | 超级管理员邮箱，默认 `superadmin@animosaas.com`        |
| `SUPER_ADMIN_PASSWORD` | 否  | 超级管理员密码，默认 `SuperAdmin123!`                  |
| `DEFAULT_TENANT_NAME`  | 否  | 默认租户名称，默认 `Default`                          |
| `TENANT_MODE`          | 否  | 租户识别模式：`subdomain` / `path` / `header`，默认 `path` |
| `APP_PORT`             | 否  | 外部映射端口，默认 `3000`                             |
| `APP_URL`              | 否  | 应用公网 URL，用于邮件链接等                             |
| `DISABLE_SECURE_COOKIE`| 否  | 设为 `true` 禁用 Secure Cookie（HTTP 环境）         |
| `LOG_LEVEL`            | 否  | 日志级别：`error` / `warn` / `info` / `debug`    |

### 容器启动流程

容器入口 `scripts/docker-entrypoint.sh` 依次执行：

```
[0/4] 校验环境变量 (JWT_SECRET / DATABASE_URL)
[1/4] 等待数据库就绪 (Prisma 连接探测，最多 30 次重试)
[2/4] 同步数据库 Schema (prisma db push)
[3/4] 初始化多租户数据 (幂等脚本)
[4/4] 启动 Node.js (node server.js)
```

Prisma CLI 通过 `node ./node_modules/prisma/build/index.js` 直接调用，避免 `npx` 在 standalone 产物中不可用的问题。

### 健康检查

```bash
# 存活检查
curl http://localhost:3000/api/health

# 就绪检查（验证数据库、默认租户、超级管理员）
curl http://localhost:3000/api/health/ready
```

### 运维命令

```bash
bash deploy.sh              # 首次部署 / 启动
bash deploy.sh --update     # 拉取最新代码并重新构建
bash deploy.sh --logs       # 查看实时日志
bash deploy.sh --stop       # 停止服务
bash deploy.sh --status     # 查看容器状态和健康检查
bash deploy.sh --reset      # 完全重置（删除所有数据，需确认）
```

## Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL 证书

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## 备份

```bash
# 手动备份
docker exec animosaas-db pg_dump -U animosaas animosaas_db > backup_$(date +%Y%m%d).sql

# 恢复
cat backup.sql | docker exec -i animosaas-db psql -U animosaas animosaas_db
```

定时备份（cron）：

```bash
0 3 * * * docker exec animosaas-db pg_dump -U animosaas animosaas_db | gzip > /backups/animosaas_$(date +\%Y\%m\%d).sql.gz
```

## 手动部署（非 Docker）

```bash
npm ci
cp .env.example .env        # 编辑环境变量
npx prisma db push           # 同步数据库 Schema
npx tsx scripts/migrate-to-multitenant.ts  # 多租户初始化
npm run build                # 构建
npm start                    # 启动
```

使用 PM2 管理进程：

```bash
pm2 start npm --name animosaas -- start
pm2 save && pm2 startup
```

## 安全加固

```bash
# 防火墙
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable
```

- 生产环境务必设置强 `JWT_SECRET`（`deploy.sh` 自动生成随机密钥）
- 启用 HTTPS 并设置 `DISABLE_SECURE_COOKIE=false`
- 数据库不要暴露到公网（移除 `docker-compose.yml` 中 db 的 ports 映射）
- 定期备份数据

## 故障排查

| 问题 | 原因 | 解决 |
|------|------|------|
| 构建失败 `Collecting page data` | 缺少环境变量 | Dockerfile 已内置占位变量，无需操作 |
| 容器重启 `prisma: not found` | standalone 产物中无 npx | 已修复，使用 `node ./node_modules/prisma/build/index.js` |
| `deploy.sh` 报错 DB\_PASSWORD 未设置 | 旧版校验过严 | 已改为警告，不再阻断部署 |
| CI lint 失败 | 缺少 JWT\_SECRET 等环境变量 | `ci.yml` 已添加全局占位变量 |
| E2E 测试连接不上服务 | CI 中未启动 next start | `e2e.yml` 已添加后台启动步骤 |
