#!/bin/bash
set -e

echo "============================================"
echo "  AnimoSaaS - Docker Entrypoint"
echo "============================================"

# 等待数据库就绪
echo "[1/4] 等待数据库连接..."
MAX_RETRIES=30
RETRY_COUNT=0
until node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.\$queryRaw\`SELECT 1\`.then(() => { p.\$disconnect(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "  数据库连接超时，退出..."
    exit 1
  fi
  echo "  数据库未就绪，重试中... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done
echo "  数据库连接成功"

# 运行数据库迁移
echo "[2/4] 运行数据库迁移..."
npx prisma migrate deploy 2>&1 || {
  echo "  警告：prisma migrate deploy 失败，尝试 db push..."
  npx prisma db push --accept-data-loss 2>&1 || {
    echo "  数据库迁移失败，退出..."
    exit 1
  }
}
echo "  数据库迁移完成"

# 运行多租户初始化（幂等）
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

# 启动应用
echo "[4/4] 启动 AnimoSaaS..."
echo "============================================"
exec node server.js
