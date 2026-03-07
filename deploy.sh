#!/bin/bash
set -e

# ============================================================
# AnimoSaaS 向导式部署脚本 
# 用法:
#   ./deploy.sh          # 向导式部署（首次）/ 启动（已配置）
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
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# 全局变量
COMPOSE_CMD=""
SCRIPT_DIR=""

# ============================================================
# 工具函数
# ============================================================

print_banner() {
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║     AnimoSaaS 部署向导                    ║${NC}"
  echo -e "${GREEN}║     多租户 SaaS 素材管理平台            ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
  echo ""
}

log_step() {
  echo -e "${BLUE}[$1]${NC} $2"
}

log_ok() {
  echo -e "  ${GREEN}✔${NC} $1"
}

log_warn() {
  echo -e "  ${YELLOW}⚠${NC} $1"
}

log_err() {
  echo -e "  ${RED}✘${NC} $1"
}

log_info() {
  echo -e "  ${DIM}$1${NC}"
}

# 生成安全随机字符串
generate_secret() {
  if command -v openssl &> /dev/null; then
    openssl rand -base64 32
  else
    head -c 32 /dev/urandom | base64
  fi
}

# 生成仅含字母数字的密码
generate_password() {
  local len="${1:-24}"
  if command -v openssl &> /dev/null; then
    openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c "$len"
  else
    head -c 48 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c "$len"
  fi
}

# 交互式输入（带默认值），空输入使用默认值
prompt_value() {
  local prompt_text="$1"
  local default_val="$2"
  local is_secret="${3:-false}"
  local result=""

  if [ "$is_secret" = "true" ]; then
    echo -en "  ${CYAN}${prompt_text}${NC} ${DIM}[自动生成]${NC}: "
    read -r result
  elif [ -n "$default_val" ]; then
    echo -en "  ${CYAN}${prompt_text}${NC} ${DIM}[${default_val}]${NC}: "
    read -r result
  else
    echo -en "  ${CYAN}${prompt_text}${NC}: "
    read -r result
  fi

  if [ -z "$result" ]; then
    echo "$default_val"
  else
    echo "$result"
  fi
}

# 是/否确认
confirm() {
  local prompt_text="$1"
  local default="${2:-y}"
  local hint="Y/n"
  [ "$default" = "n" ] && hint="y/N"

  echo -en "  ${CYAN}${prompt_text}${NC} [${hint}]: "
  read -r answer
  answer="${answer:-$default}"

  case "$answer" in
    [Yy]*) return 0 ;;
    *) return 1 ;;
  esac
}

# 从已有 .env 文件读取变量值
read_env_value() {
  local key="$1"
  local file="${2:-.env}"
  if [ -f "$file" ]; then
    grep -E "^${key}=" "$file" 2>/dev/null | head -1 | sed 's/^[^=]*=//' | sed 's/^["'\'']//' | sed 's/["'\'']$//' || true
  fi
}

# ============================================================
# 环境检查
# ============================================================

check_prerequisites() {
  log_step "环境" "检查运行环境..."

  # Docker
  if ! command -v docker &> /dev/null; then
    log_err "未安装 Docker"
    echo -e "  请先安装: ${BLUE}https://docs.docker.com/get-docker/${NC}"
    exit 1
  fi
  log_ok "Docker: $(docker --version | head -1)"

  # Docker Compose
  if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    log_err "未安装 Docker Compose"
    exit 1
  fi

  if docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
  else
    COMPOSE_CMD="docker-compose"
  fi
  log_ok "Compose: $($COMPOSE_CMD version 2>/dev/null | head -1)"

  # Docker daemon
  if ! docker info &> /dev/null 2>&1; then
    log_err "Docker 守护进程未运行"
    echo -e "  ${YELLOW}提示: 运行 'sudo systemctl start docker'${NC}"
    exit 1
  fi

  # 磁盘空间
  AVAILABLE_MB=$(df -m "$(pwd)" 2>/dev/null | awk 'NR==2{print $4}' || echo "0")
  if [ "$AVAILABLE_MB" -lt 2048 ] 2>/dev/null; then
    log_warn "磁盘剩余空间不足 2GB（当前 ${AVAILABLE_MB}MB），构建可能失败"
  fi

  # 架构
  log_ok "架构: $(uname -m)"
  echo ""
}

# ============================================================
# 向导式配置（首次部署）
# ============================================================

wizard_setup() {
  echo -e "${BOLD}══════════════════════════════════════════${NC}"
  echo -e "${BOLD}  首次部署配置向导${NC}"
  echo -e "${BOLD}══════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${DIM}按 Enter 接受 [默认值]，或输入自定义值${NC}"
  echo ""

  # ---------- 数据库 ----------
  echo -e "  ${BOLD}── 数据库配置 ──${NC}"
  local db_password
  db_password=$(generate_password 24)
  local user_db_pw
  user_db_pw=$(prompt_value "数据库密码" "$db_password")
  # 如果用户输入为空，generate 的值已经通过 prompt_value 返回
  db_password="$user_db_pw"

  local db_port
  db_port=$(prompt_value "数据库端口" "5432")
  echo ""

  # ---------- 安全 ----------
  echo -e "  ${BOLD}── 安全配置 ──${NC}"
  local jwt_secret
  jwt_secret=$(generate_secret)
  local user_jwt
  user_jwt=$(prompt_value "JWT 密钥 (≥32字符)" "$jwt_secret" "true")
  jwt_secret="$user_jwt"
  # 补全：如果用户输入为空则使用生成值
  if [ -z "$jwt_secret" ]; then
    jwt_secret=$(generate_secret)
  fi

  local admin_password
  admin_password=$(prompt_value "管理员密码" "AnimoAdmin123!")
  echo ""

  # ---------- 超级管理员 ----------
  echo -e "  ${BOLD}── 超级管理员 ──${NC}"
  local super_email
  super_email=$(prompt_value "超级管理员邮箱" "superadmin@animosaas.com")
  local super_password
  super_password=$(prompt_value "超级管理员密码" "SuperAdmin123!")
  echo ""

  # ---------- 应用配置 ----------
  echo -e "  ${BOLD}── 应用配置 ──${NC}"
  local app_port
  app_port=$(prompt_value "应用端口" "3000")
  local app_url
  app_url=$(prompt_value "应用 URL" "http://localhost:${app_port}")
  local tenant_mode
  tenant_mode=$(prompt_value "租户模式 (subdomain/path/header)" "path")
  local tenant_name
  tenant_name=$(prompt_value "默认租户名称" "Default")
  echo ""

  # ---------- 写入 .env ----------
  cat > .env << ENVEOF
# ============================================================
# AnimoSaaS 部署配置
# 由部署向导生成于 $(date '+%Y-%m-%d %H:%M:%S')
# ============================================================

# 数据库
DB_PASSWORD=${db_password}
DB_PORT=${db_port}

# JWT 密钥
JWT_SECRET=${jwt_secret}

# 管理员密码
ADMIN_PASSWORD=${admin_password}

# 超级管理员
SUPER_ADMIN_EMAIL=${super_email}
SUPER_ADMIN_PASSWORD=${super_password}

# 租户配置
DEFAULT_TENANT_NAME=${tenant_name}
TENANT_MODE=${tenant_mode}

# 应用
APP_PORT=${app_port}
APP_URL=${app_url}
DISABLE_SECURE_COOKIE=true
LOG_LEVEL=info
ENVEOF

  log_ok ".env 配置已保存"
  echo ""
}

# ============================================================
# 已有 .env 校验
# ============================================================

validate_existing_env() {
  log_step "配置" "校验已有 .env..."

  local has_error=0

  # 读取关键变量
  local jwt_secret
  jwt_secret=$(read_env_value "JWT_SECRET")
  local db_password
  db_password=$(read_env_value "DB_PASSWORD")

  # JWT_SECRET 校验
  if [ -z "$jwt_secret" ]; then
    log_err "缺少 JWT_SECRET"
    has_error=1
  elif [ ${#jwt_secret} -lt 32 ]; then
    log_err "JWT_SECRET 长度不足 32 字符（当前 ${#jwt_secret}）"
    has_error=1
  else
    log_ok "JWT_SECRET 合法"
  fi

  # DB_PASSWORD 校验
  if [ -z "$db_password" ]; then
    log_warn "DB_PASSWORD 未设置，将使用 docker-compose.yml 默认值"
  else
    log_ok "DB_PASSWORD 已设置"
  fi

  if [ "$has_error" -eq 1 ]; then
    echo ""
    log_err "配置校验失败，请修复 .env 或删除后重新运行向导"
    exit 1
  fi

  log_ok "配置校验通过"
  echo ""
}

# ============================================================
# 卷冲突检测
# ============================================================

check_volume_conflict() {
  # 检测是否存在旧的 Postgres 数据卷（密码已被固化在里面）
  local volume_name
  volume_name=$($COMPOSE_CMD config --volumes 2>/dev/null | grep -E "postgres" | head -1 || true)

  # 获取项目名（compose 用于前缀卷名）
  local project_name
  project_name=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')

  local full_volume="${project_name}_postgres_data"
  if docker volume inspect "$full_volume" &>/dev/null 2>&1; then
    log_warn "检测到已有数据库数据卷 '${full_volume}'"
    echo ""
    echo -e "  ${YELLOW}PostgreSQL 在首次启动时将密码固化到数据卷中。${NC}"
    echo -e "  ${YELLOW}如果 .env 中的 DB_PASSWORD 与卷内密码不一致，将导致认证失败。${NC}"
    echo ""
    if confirm "是否清除旧数据卷并重新初始化？（数据将丢失）" "y"; then
      log_step "清理" "移除旧容器和数据卷..."
      $COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true
      log_ok "旧数据已清除"
    else
      echo ""
      log_info "保留旧数据卷。如遇认证错误，请运行: ./deploy.sh --reset"
    fi
    echo ""
  fi
}

# ============================================================
# 配置入口（自动判断首次/已有）
# ============================================================

setup_env() {
  if [ -f .env ]; then
    validate_existing_env

    # 已有 .env 时仍需检测卷冲突
    check_volume_conflict
  else
    # 首次部署 → 向导
    wizard_setup

    # 首次部署无需检测卷冲突，但以防万一（clone 后手动操作过）
    check_volume_conflict
  fi
}

# ============================================================
# 部署
# ============================================================

deploy() {
  log_step "部署" "构建并启动服务..."

  # 构建镜像
  echo -e "  构建 Docker 镜像（首次可能需要几分钟）..."
  $COMPOSE_CMD build --no-cache 2>&1 | tail -5

  # 启动服务
  echo -e "  启动服务..."
  $COMPOSE_CMD up -d

  # 等待健康检查
  echo -e "  等待服务就绪..."
  local max_wait=180
  local elapsed=0
  local status="starting"

  while [ $elapsed -lt $max_wait ]; do
    status=$(docker inspect --format='{{.State.Health.Status}}' animosaas-app 2>/dev/null || echo "starting")
    if [ "$status" = "healthy" ]; then
      break
    fi

    # 快速失败：检测容器是否在不断重启
    if [ $elapsed -ge 30 ]; then
      local restart_count
      restart_count=$(docker inspect --format='{{.RestartCount}}' animosaas-app 2>/dev/null || echo "0")
      if [ "$restart_count" -ge 5 ] 2>/dev/null; then
        echo ""
        log_err "应用容器持续重启（已重启 ${restart_count} 次），提前终止等待"
        status="crash-loop"
        break
      fi
    fi

    echo -ne "\r  状态: ${status} (${elapsed}/${max_wait}s)    "
    sleep 5
    elapsed=$((elapsed + 5))
  done
  echo ""

  # 获取端口
  local app_port
  app_port=$(read_env_value "APP_PORT")
  app_port="${app_port:-3000}"

  if [ "$status" = "healthy" ]; then
    print_success "$app_port"
  else
    print_failure "$max_wait"
  fi
}

print_success() {
  local port="$1"
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║            部署成功！                    ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  前台地址:      ${BLUE}http://localhost:${port}${NC}"
  echo -e "  管理后台:      ${BLUE}http://localhost:${port}/admin/login${NC}"
  echo -e "  超级管理员:    ${BLUE}http://localhost:${port}/superadmin/login${NC}"
  echo -e "  健康检查:      ${BLUE}http://localhost:${port}/api/health${NC}"
  echo -e "  就绪检查:      ${BLUE}http://localhost:${port}/api/health/ready${NC}"
  echo ""
  echo -e "  查看日志:      ${YELLOW}./deploy.sh --logs${NC}"
  echo -e "  停止服务:      ${YELLOW}./deploy.sh --stop${NC}"
  echo ""
}

print_failure() {
  local max_wait="$1"
  echo -e "${RED}[失败] 服务启动失败（等待 ${max_wait}s），自动收集诊断信息...${NC}"
  echo ""

  echo -e "${YELLOW}── 数据库容器 ──${NC}"
  docker inspect --format='  状态: {{.State.Status}} | 健康: {{.State.Health.Status}}' animosaas-db 2>/dev/null || echo "  容器不存在"
  echo ""

  echo -e "${YELLOW}── 应用容器 ──${NC}"
  docker inspect --format='  状态: {{.State.Status}} | 重启次数: {{.RestartCount}}' animosaas-app 2>/dev/null || echo "  容器不存在"
  echo ""

  echo -e "${YELLOW}── 应用日志（最近 30 行） ──${NC}"
  $COMPOSE_CMD logs app --tail 30 2>/dev/null || true
  echo ""

  echo -e "${YELLOW}── 数据库日志（最近 10 行） ──${NC}"
  $COMPOSE_CMD logs db --tail 10 2>/dev/null || true
  echo ""

  # 智能诊断
  echo -e "${BOLD}── 自动诊断 ──${NC}"
  local app_logs
  app_logs=$($COMPOSE_CMD logs app --tail 50 2>/dev/null || true)

  if echo "$app_logs" | grep -qi "Authentication failed\|P1000\|password authentication failed"; then
    log_err "检测到数据库认证失败"
    echo -e "  ${YELLOW}原因: .env 中的 DB_PASSWORD 与 PostgreSQL 数据卷内的密码不一致${NC}"
    echo -e "  ${YELLOW}修复: 运行 ${BOLD}./deploy.sh --reset${NC}${YELLOW} 后重新部署${NC}"
  elif echo "$app_logs" | grep -qi "ECONNREFUSED\|Connection refused"; then
    log_err "检测到数据库连接被拒绝"
    echo -e "  ${YELLOW}原因: 数据库容器可能未正常启动${NC}"
    echo -e "  ${YELLOW}修复: 检查 docker compose logs db${NC}"
  elif echo "$app_logs" | grep -qi "JWT_SECRET\|Missing.*environment"; then
    log_err "检测到环境变量缺失"
    echo -e "  ${YELLOW}修复: 检查 .env 文件完整性，或删除后重新运行向导${NC}"
  else
    log_warn "未识别到常见错误模式，请查看上方日志排查"
  fi

  echo ""
  echo -e "${BLUE}手动排查:${NC}"
  echo -e "  完整日志:  $COMPOSE_CMD logs app"
  echo -e "  进入容器:  docker exec -it animosaas-app bash"
  echo -e "  完全重置:  ./deploy.sh --reset"
  echo ""
}

# ============================================================
# 子命令
# ============================================================

update() {
  log_step "更新" "拉取最新代码并重新构建..."

  if command -v git &> /dev/null && [ -d .git ]; then
    git pull origin main 2>/dev/null || log_warn "Git pull 跳过"
  fi

  $COMPOSE_CMD down
  $COMPOSE_CMD build --no-cache
  $COMPOSE_CMD up -d

  log_ok "更新完成"
}

stop() {
  log_step "停止" "停止所有服务..."
  $COMPOSE_CMD down
  log_ok "服务已停止"
}

reset() {
  echo -e "${RED}╔══════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ⚠ 警告：此操作将删除所有数据和配置！   ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  将执行: 停止容器 → 删除数据卷 → 删除 .env"
  echo ""
  read -p "  确认重置？输入 'YES' 继续: " confirm
  if [ "$confirm" != "YES" ]; then
    echo "  已取消"
    exit 0
  fi

  log_step "重置" "清理所有容器和数据..."
  $COMPOSE_CMD down -v --remove-orphans
  rm -f .env
  log_ok "重置完成"
  echo -e "  运行 ${BLUE}./deploy.sh${NC} 重新开始向导式部署"
}

show_logs() {
  $COMPOSE_CMD logs -f --tail=100
}

show_status() {
  log_step "状态" "容器状态:"
  $COMPOSE_CMD ps
  echo ""
  log_step "健康" "健康检查:"
  local app_port
  app_port=$(read_env_value "APP_PORT")
  app_port="${app_port:-3000}"
  curl -s "http://localhost:${app_port}/api/health" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "  服务未就绪"
}

# ============================================================
# 主入口
# ============================================================

print_banner

# 切换到脚本所在目录
cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"

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
    echo "  (无)        向导式部署（首次）/ 校验并启动（已配置）"
    echo "  --update    拉取最新代码并重新构建"
    echo "  --stop      停止所有服务"
    echo "  --reset     完全重置（删除所有数据和配置）"
    echo "  --logs      查看实时日志"
    echo "  --status    查看容器状态"
    echo "  --help      显示此帮助"
    ;;
  *)
    setup_env
    deploy
    ;;
esac
