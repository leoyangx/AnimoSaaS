#!/bin/bash
set -e

# ============================================================
# AnimoSaaS 一键部署脚本
# 用法:
#   ./deploy.sh          # 首次部署 / 启动
#   ./deploy.sh --update # 拉取最新代码并重新构建
#   ./deploy.sh --stop   # 停止所有容器
#   ./deploy.sh --reset  # 完全重置（删除数据）
#   ./deploy.sh --logs   # 查看实时日志
#   ./deploy.sh --status # 查看容器状态
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_banner() {
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║       AnimoSaaS 一键部署工具 v1.0       ║${NC}"
  echo -e "${GREEN}║   多租户 SaaS 素材管理平台              ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
  echo ""
}

check_prerequisites() {
  echo -e "${BLUE}[检查] 检查运行环境...${NC}"

  # ---------- Docker ----------
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}[错误] 未安装 Docker，请先安装: https://docs.docker.com/get-docker/${NC}"
    exit 1
  fi
  echo -e "  Docker: $(docker --version | head -1)"

  if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}[错误] 未安装 Docker Compose${NC}"
    exit 1
  fi

  # 检测 docker compose 命令
  if docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
  else
    COMPOSE_CMD="docker-compose"
  fi
  echo -e "  Compose: $($COMPOSE_CMD version 2>/dev/null | head -1)"

  if ! docker info &> /dev/null 2>&1; then
    echo -e "${RED}[错误] Docker 守护进程未运行${NC}"
    echo -e "${YELLOW}  提示: 运行 'sudo systemctl start docker' 或 'sudo service docker start'${NC}"
    exit 1
  fi

  # ---------- 磁盘空间 ----------
  AVAILABLE_MB=$(df -m "$(pwd)" 2>/dev/null | awk 'NR==2{print $4}' || echo "0")
  if [ "$AVAILABLE_MB" -lt 2048 ] 2>/dev/null; then
    echo -e "${YELLOW}[警告] 磁盘剩余空间不足 2GB（当前 ${AVAILABLE_MB}MB），构建可能失败${NC}"
  fi

  # ---------- 架构信息 ----------
  ARCH=$(uname -m)
  echo -e "  架构: ${ARCH}"

  echo -e "${GREEN}  环境检查通过${NC}"
  echo ""
}

generate_secret() {
  if command -v openssl &> /dev/null; then
    openssl rand -base64 32
  else
    head -c 32 /dev/urandom | base64
  fi
}

validate_env() {
  # 宽松校验：只阻断真正致命的问题，其余给出警告
  local HAS_ERROR=0

  # 安全地逐行解析 .env（兼容带引号、注释行）
  while IFS= read -r line; do
    # 跳过空行和注释
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    # 提取 KEY=VALUE（去掉行内注释）
    local key="${line%%=*}"
    local value="${line#*=}"
    # 去掉首尾引号
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    # 导出变量
    export "$key=$value" 2>/dev/null || true
  done < .env

  # --- JWT_SECRET: 必须存在且长度 >= 32 ---
  if [ -z "${JWT_SECRET:-}" ]; then
    echo -e "${RED}  [ERROR] .env 中缺少 JWT_SECRET${NC}"
    HAS_ERROR=1
  elif [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}  [ERROR] JWT_SECRET 长度不足 32 个字符（当前 ${#JWT_SECRET}）${NC}"
    HAS_ERROR=1
  fi

  # --- DB_PASSWORD: 缺失时仅警告（docker-compose.yml 有默认值兜底） ---
  if [ -z "${DB_PASSWORD:-}" ]; then
    echo -e "${YELLOW}  [WARN] DB_PASSWORD 未在 .env 中设置，将使用 docker-compose.yml 默认值${NC}"
  fi

  if [ "$HAS_ERROR" -eq 1 ]; then
    echo -e "${RED}  请修复 .env 文件后重试，或删除 .env 让脚本重新生成${NC}"
    exit 1
  fi

  echo -e "${GREEN}  .env 关键变量校验通过${NC}"
  echo ""
}

setup_env() {
  if [ -f .env ]; then
    echo -e "${YELLOW}[提示] 已存在 .env 文件，校验关键变量...${NC}"
    validate_env
    return
  fi

  echo -e "${BLUE}[配置] 生成环境配置文件...${NC}"

  JWT_SECRET=$(generate_secret)
  DB_PASSWORD=$(generate_secret | tr -dc 'a-zA-Z0-9' | head -c 24)

  cat > .env << EOF
# ============================================================
# AnimoSaaS 部署配置
# 由 deploy.sh 自动生成于 $(date '+%Y-%m-%d %H:%M:%S')
# ============================================================

# 数据库密码
DB_PASSWORD=${DB_PASSWORD}
DB_PORT=5432

# JWT 密钥（自动生成）
JWT_SECRET=${JWT_SECRET}

# 管理员密码（请修改！）
ADMIN_PASSWORD=AnimoAdmin123!

# 超级管理员（多租户管理）
SUPER_ADMIN_EMAIL=superadmin@animosaas.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!

# 默认租户名称
DEFAULT_TENANT_NAME=Default

# 租户识别模式: subdomain | path | header
TENANT_MODE=path

# 应用端口
APP_PORT=3000

# 应用 URL（修改为你的实际域名）
APP_URL=http://localhost:3000

# Cookie 安全（HTTPS 环境设为 false）
DISABLE_SECURE_COOKIE=true

# 日志级别: error | warn | info | debug
LOG_LEVEL=info
EOF

  echo -e "${GREEN}  .env 文件已生成${NC}"
  echo -e "${YELLOW}  ⚠ 请修改 .env 中的密码后再部署！${NC}"
  echo ""
}

deploy() {
  echo -e "${BLUE}[部署] 构建并启动服务...${NC}"

  # 构建镜像
  echo -e "  构建 Docker 镜像（首次可能需要几分钟）..."
  $COMPOSE_CMD build --no-cache 2>&1 | tail -5

  # 启动服务
  echo -e "  启动服务..."
  $COMPOSE_CMD up -d

  # 等待健康检查
  echo -e "  等待服务就绪..."
  MAX_WAIT=120
  ELAPSED=0
  while [ $ELAPSED -lt $MAX_WAIT ]; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' animosaas-app 2>/dev/null || echo "starting")
    if [ "$STATUS" = "healthy" ]; then
      break
    fi
    echo -ne "\r  状态: $STATUS ($ELAPSED/${MAX_WAIT}s)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
  done
  echo ""

  # 获取端口
  APP_PORT=$(grep APP_PORT .env 2>/dev/null | cut -d= -f2 || echo "3000")
  APP_PORT=${APP_PORT:-3000}

  if [ "$STATUS" = "healthy" ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          部署成功！                      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  前台地址:      ${BLUE}http://localhost:${APP_PORT}${NC}"
    echo -e "  管理后台:      ${BLUE}http://localhost:${APP_PORT}/admin/login${NC}"
    echo -e "  超级管理员:    ${BLUE}http://localhost:${APP_PORT}/superadmin/login${NC}"
    echo -e "  健康检查:      ${BLUE}http://localhost:${APP_PORT}/api/health${NC}"
    echo -e "  就绪检查:      ${BLUE}http://localhost:${APP_PORT}/api/health/ready${NC}"
    echo -e "  API 文档:      ${BLUE}http://localhost:${APP_PORT}/api/v1/assets${NC}"
    echo ""
    echo -e "  查看日志:      ${YELLOW}./deploy.sh --logs${NC}"
    echo -e "  停止服务:      ${YELLOW}./deploy.sh --stop${NC}"
    echo ""
  else
    echo -e "${YELLOW}[警告] 服务启动超时，请检查日志:${NC}"
    echo -e "  $COMPOSE_CMD logs app"
  fi
}

update() {
  echo -e "${BLUE}[更新] 拉取最新代码并重新构建...${NC}"

  if command -v git &> /dev/null && [ -d .git ]; then
    git pull origin main 2>/dev/null || echo -e "${YELLOW}  Git pull 跳过${NC}"
  fi

  $COMPOSE_CMD down
  $COMPOSE_CMD build --no-cache
  $COMPOSE_CMD up -d

  echo -e "${GREEN}[完成] 更新完成${NC}"
}

stop() {
  echo -e "${BLUE}[停止] 停止所有服务...${NC}"
  $COMPOSE_CMD down
  echo -e "${GREEN}[完成] 服务已停止${NC}"
}

reset() {
  echo -e "${RED}╔══════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ⚠ 警告：此操作将删除所有数据！         ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════╝${NC}"
  read -p "确认重置？输入 'YES' 继续: " confirm
  if [ "$confirm" != "YES" ]; then
    echo "已取消"
    exit 0
  fi

  echo -e "${BLUE}[重置] 清理所有容器和数据...${NC}"
  $COMPOSE_CMD down -v --remove-orphans
  rm -f .env
  echo -e "${GREEN}[完成] 重置完成，运行 ./deploy.sh 重新部署${NC}"
}

show_logs() {
  $COMPOSE_CMD logs -f --tail=100
}

show_status() {
  echo -e "${BLUE}[状态] 容器状态:${NC}"
  $COMPOSE_CMD ps
  echo ""
  echo -e "${BLUE}[健康检查]:${NC}"
  APP_PORT=$(grep APP_PORT .env 2>/dev/null | cut -d= -f2 || echo "3000")
  APP_PORT=${APP_PORT:-3000}
  curl -s "http://localhost:${APP_PORT}/api/health" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "  服务未就绪"
}

# ============================================================
# 主入口
# ============================================================

print_banner

# 切换到脚本所在目录
cd "$(dirname "$0")"

check_prerequisites

case "${1:-}" in
  --update|-u)
    update
    ;;
  --stop|-s)
    stop
    ;;
  --reset)
    reset
    ;;
  --logs|-l)
    show_logs
    ;;
  --status)
    show_status
    ;;
  --help|-h)
    echo "用法: ./deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  (无)        首次部署 / 启动服务"
    echo "  --update    拉取最新代码并重新构建"
    echo "  --stop      停止所有服务"
    echo "  --reset     完全重置（删除所有数据）"
    echo "  --logs      查看实时日志"
    echo "  --status    查看容器状态"
    echo "  --help      显示此帮助"
    ;;
  *)
    setup_env
    deploy
    ;;
esac
