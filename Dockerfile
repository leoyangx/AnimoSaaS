# ==================== 依赖阶段 ====================
FROM node:20-slim AS deps
WORKDIR /app

# 安装 OpenSSL（Prisma 需要）
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# 安装所有依赖（构建阶段需要 devDependencies）
RUN npm ci --ignore-scripts

# ==================== 构建阶段 ====================
FROM node:20-slim AS builder
WORKDIR /app

# 安装 OpenSSL
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置构建时环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建阶段占位环境变量（仅用于通过模块加载，不会写入 standalone 产物）
# Next.js 服务端代码的 process.env 在运行时从真实环境读取
ENV JWT_SECRET="build-placeholder-secret-at-least-32-characters-long"
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV TENANT_MODE="path"

# 生成 Prisma Client
RUN npx prisma generate

# 构建 Next.js 应用
RUN npm run build

# 验证 standalone 输出
RUN ls -la .next/standalone/server.js || (echo "ERROR: .next/standalone/server.js not found!" && exit 1)

# ==================== 运行阶段 ====================
FROM node:20-slim AS runner
WORKDIR /app

# 安装运行时依赖：OpenSSL + bash + tini（PID 1 信号转发）+ curl（健康检查）+ postgresql-client（pg_isready）
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl bash tini curl postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# 创建用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --gid 1001 nextjs

# 创建必要的目录
RUN mkdir -p /app/public/uploads /app/logs /app/scripts && \
    chown -R nextjs:nodejs /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 1. 复制 Next.js Standalone 产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 2. 复制 Prisma（Client + CLI）
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# 3. 复制脚本和配置文件
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# 4. 安装运行时工具（tsx 用于多租户初始化脚本）
#    prisma CLI 通过 node ./node_modules/prisma/build/index.js 调用（npx 在 standalone 中不可用）
RUN npm install -g tsx

# 5. 设置入口脚本权限
RUN chmod +x /app/scripts/docker-entrypoint.sh

# 切换到非 root 用户
USER nextjs

EXPOSE 3000

# 健康检查：使用 curl 比 node -e 更轻量，超时更可控
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 使用 tini 作为 PID 1 进程，确保信号正确转发（SIGTERM 优雅关闭）
ENTRYPOINT ["tini", "--"]
CMD ["/app/scripts/docker-entrypoint.sh"]
