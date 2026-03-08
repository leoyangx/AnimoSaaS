#!/bin/bash

# ==========================================
#  AnimoSaaS — 生产环境部署清单
# ==========================================
# 使用方法: bash scripts/deploy-checklist.sh
# 此脚本检查生产部署的所有必要条件

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check_pass() { echo -e "  ${GREEN}[PASS]${NC} $1"; ((PASS++)); }
check_fail() { echo -e "  ${RED}[FAIL]${NC} $1"; ((FAIL++)); }
check_warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; ((WARN++)); }

echo "=========================================="
echo "  AnimoSaaS 生产部署检查清单"
echo "=========================================="
echo ""

# 1. 环境文件
echo -e "${BLUE}[1/7] 环境配置${NC}"
if [ -f .env ]; then
    check_pass ".env 文件存在"
    source .env

    # JWT_SECRET
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "CHANGE_THIS_TO_RANDOM_32_CHARS_OR_MORE" ]; then
        check_fail "JWT_SECRET 未设置或使用默认值（请运行: openssl rand -base64 32）"
    elif [ ${#JWT_SECRET} -lt 32 ]; then
        check_fail "JWT_SECRET 长度不足 32 字符"
    else
        check_pass "JWT_SECRET 已设置（长度: ${#JWT_SECRET}）"
    fi

    # DB_PASSWORD
    if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "CHANGE_THIS_TO_STRONG_PASSWORD" ]; then
        check_fail "DB_PASSWORD 未设置或使用默认值"
    else
        check_pass "DB_PASSWORD 已设置"
    fi

    # ADMIN_PASSWORD
    if [ -z "$ADMIN_PASSWORD" ] || [ "$ADMIN_PASSWORD" = "CHANGE_THIS_SecurePass123" ]; then
        check_fail "ADMIN_PASSWORD 未设置或使用默认值"
    else
        check_pass "ADMIN_PASSWORD 已设置（默认租户管理员）"
    fi

    # SUPER_ADMIN_PASSWORD
    if [ -z "$SUPER_ADMIN_PASSWORD" ] || [ "$SUPER_ADMIN_PASSWORD" = "CHANGE_THIS_SuperSecure123!" ]; then
        check_warn "SUPER_ADMIN_PASSWORD 使用默认值（请修改！）"
    else
        check_pass "SUPER_ADMIN_PASSWORD 已设置（平台超级管理员）"
    fi

    # Cookie 安全
    if [ "$DISABLE_SECURE_COOKIE" = "true" ]; then
        check_fail "DISABLE_SECURE_COOKIE=true（生产环境必须为 false，需要 HTTPS）"
    else
        check_pass "Cookie 安全模式已启用"
    fi

    # NODE_ENV
    if [ "$NODE_ENV" = "production" ]; then
        check_pass "NODE_ENV=production"
    else
        check_warn "NODE_ENV 不是 production（当前: ${NODE_ENV:-未设置}）"
    fi
else
    check_fail ".env 文件不存在（请执行: cp .env.production .env && nano .env）"
fi

echo ""

# 2. Docker
echo -e "${BLUE}[2/7] Docker 环境${NC}"
if command -v docker &> /dev/null; then
    check_pass "Docker 已安装（$(docker --version | cut -d' ' -f3)）"
else
    check_fail "Docker 未安装"
fi

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    check_pass "Docker Compose 可用"
else
    check_fail "Docker Compose 不可用"
fi

echo ""

# 3. 目录结构
echo -e "${BLUE}[3/7] 目录结构${NC}"
for dir in public/uploads logs backups; do
    if [ -d "$dir" ]; then
        check_pass "$dir/ 目录存在"
    else
        check_warn "$dir/ 目录不存在（将自动创建）"
        mkdir -p "$dir"
    fi
done

echo ""

# 4. 文件完整性
echo -e "${BLUE}[4/7] 必要文件${NC}"
for file in Dockerfile docker-compose.yml prisma/schema.prisma scripts/docker-entrypoint.sh; do
    if [ -f "$file" ]; then
        check_pass "$file 存在"
    else
        check_fail "$file 缺失"
    fi
done

echo ""

# 5. 网络
echo -e "${BLUE}[5/7] 网络 & SSL${NC}"
if [ -f nginx.conf.example ]; then
    check_pass "Nginx 配置模板存在"
else
    check_warn "nginx.conf.example 不存在"
fi

if command -v nginx &> /dev/null; then
    check_pass "Nginx 已安装"
else
    check_warn "Nginx 未安装（如需反向代理请安装）"
fi

if command -v certbot &> /dev/null; then
    check_pass "Certbot 已安装（可用于 SSL 证书）"
else
    check_warn "Certbot 未安装（推荐用于自动 SSL 证书）"
fi

echo ""

# 6. 备份
echo -e "${BLUE}[6/7] 备份 & 恢复${NC}"
if [ -f scripts/backup.sh ]; then
    check_pass "备份脚本存在"
else
    check_fail "备份脚本缺失"
fi

echo ""

# 7. 安全检查
echo -e "${BLUE}[7/7] 安全检查${NC}"
if [ -f .env ] && grep -q "SecurePassword123" .env; then
    check_fail "检测到默认密码 SecurePassword123"
elif [ -f .env ] && grep -q "SuperAdmin123" .env; then
    check_fail "检测到默认超管密码 SuperAdmin123"
else
    check_pass "未检测到默认密码"
fi

if [ -f .env ] && grep -q "your-super-secret" .env; then
    check_fail "检测到默认 JWT 密钥"
else
    check_pass "JWT 密钥已更改"
fi

echo ""
echo "=========================================="
echo -e "  结果: ${GREEN}${PASS} 通过${NC} / ${RED}${FAIL} 失败${NC} / ${YELLOW}${WARN} 警告${NC}"
echo "=========================================="

if [ $FAIL -gt 0 ]; then
    echo ""
    echo -e "${RED}存在 $FAIL 项必须修复的问题，请修复后重新检查。${NC}"
    exit 1
fi

if [ $WARN -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}存在 $WARN 项警告，建议修复。${NC}"
fi

echo ""
echo -e "${GREEN}部署就绪！运行以下命令启动：${NC}"
echo "  bash scripts/deploy.sh"
