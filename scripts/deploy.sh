#!/bin/bash

set -e

echo "🚀 AnimoSaaS 生产部署脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${RED}❌ 错误: .env 文件不存在${NC}"
    echo "请复制 .env.production 并配置："
    echo "  cp .env.production .env"
    echo "  nano .env"
    exit 1
fi

# 检查必需的环境变量
echo "📋 检查环境变量..."
source .env

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "CHANGE_THIS_TO_RANDOM_32_CHARS_OR_MORE" ]; then
    echo -e "${RED}❌ 错误: JWT_SECRET 未设置或使用默认值${NC}"
    echo "请生成强随机密钥: openssl rand -base64 32"
    exit 1
fi

if [ -z "$ADMIN_PASSWORD" ] || [ "$ADMIN_PASSWORD" = "CHANGE_THIS_SecurePass123" ]; then
    echo -e "${RED}❌ 错误: ADMIN_PASSWORD 未设置或使用默认值${NC}"
    exit 1
fi

if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "CHANGE_THIS_TO_STRONG_PASSWORD" ]; then
    echo -e "${RED}❌ 错误: DB_PASSWORD 未设置或使用默认值${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 环境变量检查通过${NC}"

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p public/uploads
mkdir -p logs
mkdir -p backups

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker-compose build --no-cache

# 启动数据库
echo "🗄️  启动数据库..."
docker-compose up -d db

# 等待数据库就绪
echo "⏳ 等待数据库就绪..."
sleep 10

# 运行数据库迁移
echo "🔄 运行数据库迁移..."
docker-compose run --rm app npx prisma migrate deploy

# 启动应用
echo "🚀 启动应用..."
docker-compose up -d app

# 等待应用就绪
echo "⏳ 等待应用就绪..."
sleep 15

# 健康检查
echo "🏥 健康检查..."
if curl -f http://localhost:${APP_PORT:-3000}/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 应用健康检查通过${NC}"
else
    echo -e "${YELLOW}⚠️  应用健康检查失败，请查看日志${NC}"
    docker-compose logs app
fi

# 显示状态
echo ""
echo "================================"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "📊 服务状态:"
docker-compose ps
echo ""
echo "🌐 访问地址: http://localhost:${APP_PORT:-3000}"
echo "🔧 管理后台: http://localhost:${APP_PORT:-3000}/admin/login"
echo "🔑 初始化管理员: http://localhost:${APP_PORT:-3000}/api/init"
echo ""
echo "📝 查看日志:"
echo "  docker-compose logs -f app"
echo ""
echo "🛑 停止服务:"
echo "  docker-compose down"
