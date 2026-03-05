# Stage 1: Dependencies (安装所有依赖)
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install

# Stage 2: Builder (构建项目)
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Prune (准备“全家桶”生产依赖)
FROM deps AS pruned
WORKDIR /app
# 自动清理开发依赖，仅保留生产环境所需的完整依赖树（包含 Prisma 及其深层子依赖）
RUN npm prune --omit=dev

# Stage 4: Runner (最终运行镜像)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 权限自愈与安全配置
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --gid 1001 nextjs
RUN mkdir -p /home/nextjs/.npm && chown -R nextjs:nodejs /home/nextjs
ENV HOME=/home/nextjs

# 1. 复制 Next.js Standalone 产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# 2. 核心重构：覆盖并提供完整的“全家桶”依赖（解决 MODULE_NOT_FOUND）
# 我们直接将经过 prune 处理的完整 node_modules 拷贝进来
COPY --from=pruned /app/node_modules ./node_modules
# 确保生成的 Prisma Client 也在其中
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 确保启动脚本权限
USER root
RUN chmod +x ./entrypoint.sh && chown nextjs:nodejs ./entrypoint.sh
USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 启动即就绪：自动同步数据库并运行应用
ENTRYPOINT ["./entrypoint.sh"]