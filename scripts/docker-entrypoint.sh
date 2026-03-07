#!/bin/bash
set -euo pipefail

echo "============================================"
echo "  AnimoSaaS - Docker Entrypoint"
echo "============================================"

# ========== Prisma CLI 路径自动探测 ==========
# standalone 产物中 npx/bin 不可用，直接调用 prisma 的 Node 入口
if [ -f "./node_modules/prisma/build/index.js" ]; then
  PRISMA_CMD="node ./node_modules/prisma/build/index.js"
elif [ -f "./node_modules/.bin/prisma" ]; then
  PRISMA_CMD="./node_modules/.bin/prisma"
elif command -v prisma &> /dev/null; then
  PRISMA_CMD="prisma"
else
  echo "  [ERROR] 找不到 Prisma CLI，请检查 Dockerfile 是否正确复制了 node_modules/prisma"
  exit 1
fi
echo "  Prisma CLI: $PRISMA_CMD"

# ========== 信号处理：优雅关闭 ==========
cleanup() {
  echo ""
  echo "[SHUTDOWN] 收到终止信号，正在优雅关闭..."
  if [ -n "${NODE_PID:-}" ]; then
    kill -TERM "$NODE_PID" 2>/dev/null || true
    wait "$NODE_PID" 2>/dev/null || true
  fi
  echo "[SHUTDOWN] 已关闭"
  exit 0
}
trap cleanup SIGTERM SIGINT SIGQUIT

# ========== 环境变量校验 ==========
echo "[0/4] 校验环境变量..."
MISSING_VARS=""
[ -z "${DATABASE_URL:-}" ] && MISSING_VARS="$MISSING_VARS DATABASE_URL"
[ -z "${JWT_SECRET:-}" ] && MISSING_VARS="$MISSING_VARS JWT_SECRET"

if [ -n "$MISSING_VARS" ]; then
  echo "  [ERROR] 缺少必要的环境变量:$MISSING_VARS"
  echo "  请在 docker-compose.yml 或 docker run -e 中设置这些变量"
  exit 1
fi

if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "  [ERROR] JWT_SECRET 长度不足 32 个字符"
  exit 1
fi
echo "  环境变量校验通过"

# ========== 等待数据库就绪 ==========
echo "[1/4] 等待数据库连接..."
MAX_RETRIES=${DB_CONNECT_RETRIES:-30}
RETRY_INTERVAL=${DB_CONNECT_INTERVAL:-2}
RETRY_COUNT=0

until node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.\$queryRaw\`SELECT 1\`.then(() => { p.\$disconnect(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "  [ERROR] 数据库连接超时（已重试 ${MAX_RETRIES} 次），退出..."
    exit 1
  fi
  echo "  数据库未就绪，重试中... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep "$RETRY_INTERVAL"
done
echo "  数据库连接成功"

# ========== 同步数据库 Schema ==========
echo "[2/4] 同步数据库 Schema..."
if $PRISMA_CMD db push --skip-generate --accept-data-loss 2>&1; then
  echo "  Schema 同步完成"
else
  echo "  [ERROR] 数据库 Schema 同步失败，退出..."
  exit 1
fi

# ========== 运行多租户初始化（幂等） ==========
echo "[3/4] 初始化多租户数据..."
if [ -f "scripts/migrate-to-multitenant.ts" ]; then
  npx tsx scripts/migrate-to-multitenant.ts 2>&1 || {
    echo "  警告：多租户初始化脚本执行失败（可能已初始化）"
  }
elif [ -f "scripts/migrate-to-multitenant.js" ]; then
  node scripts/migrate-to-multitenant.js 2>&1 || {
    echo "  警告：多租户初始化脚本执行失败（可能已初始化）"
  }
else
  echo "  跳过：未找到多租户初始化脚本"
fi
echo "  多租户初始化完成"

# ========== 启动应用 ==========
echo "[4/4] 启动 AnimoSaaS..."
echo "  PORT=${PORT:-3000} | NODE_ENV=${NODE_ENV:-production}"
echo "============================================"

# 后台启动 Node 并等待，以便信号可以被 trap 捕获
node server.js &
NODE_PID=$!
wait "$NODE_PID"
