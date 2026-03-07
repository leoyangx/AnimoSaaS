# ==================== 依赖阶段 ====================
FROM node:20-slim AS deps
WORKDIR /app

# 安装 OpenSSL（Prisma 需要）
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci --only=production --ignore-scripts
RUN npm install prisma --save-dev

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

# 生成 Prisma Client
RUN npx prisma generate

# 构建 Next.js 应用
RUN npm run build

# 验证 standalone 输出
RUN ls -la .next/standalone || (echo "ERROR: .next/standalone not found! Check next.config.ts" && exit 1)

# ==================== 运行阶段 ====================
FROM node:20-slim AS runner
WORKDIR /app

# 安装 OpenSSL 和 bash
RUN apt-get update && apt-get install -y openssl bash && rm -rf /var/lib/apt/lists/*

# 创建用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --gid 1001 nextjs

# 创建必要的目录
RUN mkdir -p /app/public/uploads && \
    mkdir -p /app/logs && \
    mkdir -p /app/scripts && \
    chown -R nextjs:nodejs /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 1. 复制 Next.js Standalone 产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 2. 复制 Prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# 3. 复制脚本和配置文件
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts

# 4. 安装运行时工具（prisma CLI + tsx）
RUN npm install -g prisma@6.4.1 tsx

# 5. 设置入口脚本权限
RUN chmod +x /app/scripts/docker-entrypoint.sh

# 切换到非 root 用户
USER nextjs

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用入口脚本启动（自动迁移 + 初始化 + 启动）
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
