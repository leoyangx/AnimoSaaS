#!/bin/sh
set -e

echo "🚀 Starting AnimoSaaS Lifecycle Management..."

# 1. 权限自愈 (Self-healing permissions)
# 确保 nextjs 用户对必要目录有写入权限
if [ "$(id -u)" = "0" ]; then
    echo "🔧 Running as root, applying permission fixes..."
    chown -R nextjs:nodejs /app
    chmod -R 755 /app
fi

# 2. 数据库自动化同步 (Automated DB Sync)
echo "🔄 Synchronizing database schema..."
# 直接调用本地二进制文件，确保零下载和离线运行能力
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss

echo "✅ Database is ready."

# 3. 启动应用
echo "🌟 Launching AnimoSaaS Application..."
exec node server.js
