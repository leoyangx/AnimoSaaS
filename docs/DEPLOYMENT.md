# 部署指南

## Docker 部署（推荐）

### 一键部署

```bash
bash scripts/deploy.sh
```

### 手动 Docker Compose

```bash
cp .env.example .env
# 编辑 .env 设置必要变量
docker-compose up -d
```

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接串 |
| `JWT_SECRET` | 是 | JWT 签名密钥（32+ 字符） |
| `SUPER_ADMIN_EMAIL` | 是 | 超级管理员邮箱 |
| `SUPER_ADMIN_PASSWORD` | 是 | 超级管理员密码 |
| `DEFAULT_TENANT_NAME` | 否 | 默认租户名称 |
| `TENANT_MODE` | 否 | 租户识别模式：`subdomain` / `path` / `header` |
| `LOG_LEVEL` | 否 | 日志级别：`info` / `debug` / `warn` / `error` |

### 启动流程

容器入口 `scripts/docker-entrypoint.sh` 依次执行：

1. 等待 PostgreSQL 就绪（最多 30 次重试）
2. `prisma migrate deploy`（失败回退到 `prisma db push`）
3. 多租户初始化脚本（幂等）
4. 启动 Node.js

### 健康检查

```bash
# 存活检查
curl http://localhost:3000/api/health

# 就绪检查（验证数据库、默认租户、超级管理员）
curl http://localhost:3000/api/health/ready
```

### 运维命令

```bash
bash scripts/deploy.sh --update   # 更新部署
bash scripts/deploy.sh --logs     # 查看日志
bash scripts/deploy.sh --stop     # 停止服务
bash scripts/deploy.sh --reset    # 重置数据
bash scripts/deploy.sh --status   # 查看状态
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
docker exec animosaas-db pg_dump -U postgres animosaas > backup_$(date +%Y%m%d).sql

# 恢复
cat backup.sql | docker exec -i animosaas-db psql -U postgres animosaas
```

定时备份（cron）：

```bash
0 3 * * * docker exec animosaas-db pg_dump -U postgres animosaas | gzip > /backups/animosaas_$(date +\%Y\%m\%d).sql.gz
```

## 手动部署

```bash
npm ci
cp .env.example .env        # 编辑环境变量
npx prisma migrate deploy   # 数据库迁移
npx tsx scripts/init-multi-tenant.ts  # 多租户初始化
npm run build               # 构建
npm start                   # 启动
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

- 生产环境务必设置强 `JWT_SECRET`
- 启用 HTTPS
- 数据库不要暴露到公网
- 定期备份数据
