#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  AnimoSaaS 安装与部署工具
#  https://github.com/leoyangx/AnimoSaaS
#
#  快速开始:
#    curl -fsSL https://raw.githubusercontent.com/leoyangx/AnimoSaaS/main/deploy.sh | bash
#
#  或先克隆仓库:
#    git clone https://github.com/leoyangx/AnimoSaaS.git && cd AnimoSaaS
#    ./deploy.sh
#
#  基于 MIT 协议开源
# ─────────────────────────────────────────────────────────────

set -euo pipefail

# ── Constants ────────────────────────────────────────────────

readonly ANIMOSAAS_VERSION="2.0.0"
readonly ANIMOSAAS_MIN_DOCKER="20.10.0"
readonly ANIMOSAAS_MIN_DISK_MB=2048
readonly ANIMOSAAS_HEALTH_TIMEOUT=180
readonly ANIMOSAAS_CONTAINER_APP="animosaas-app"
readonly ANIMOSAAS_CONTAINER_DB="animosaas-db"
readonly ANIMOSAAS_REPO="https://github.com/leoyangx/AnimoSaaS.git"

# ── Terminal Colors & Symbols ────────────────────────────────

if [[ -t 1 ]] && [[ "${TERM:-}" != "dumb" ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  CYAN='\033[0;36m'
  MAGENTA='\033[0;35m'
  BOLD='\033[1m'
  DIM='\033[2m'
  UNDERLINE='\033[4m'
  NC='\033[0m'
  CHECKMARK='✔'
  CROSSMARK='✘'
  ARROW='▸'
  WARNING='⚠'
  SPINNER_CHARS='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
else
  RED='' GREEN='' YELLOW='' BLUE='' CYAN='' MAGENTA=''
  BOLD='' DIM='' UNDERLINE='' NC=''
  CHECKMARK='[OK]'
  CROSSMARK='[FAIL]'
  ARROW='>'
  WARNING='[!]'
  SPINNER_CHARS='|/-\'
fi

# ── Global State ─────────────────────────────────────────────

COMPOSE_CMD=""
SCRIPT_DIR=""
VERBOSE=0

# ── Logging ──────────────────────────────────────────────────

_timestamp() {
  date '+%H:%M:%S'
}

info() {
  printf "  %b%s%b %b\n" "${BLUE}" "${ARROW}" "${NC}" "$*"
}

success() {
  printf "  %b%s%b %b\n" "${GREEN}" "${CHECKMARK}" "${NC}" "$*"
}

warn() {
  printf "  %b%s%b %b\n" "${YELLOW}" "${WARNING}" "${NC}" "$*"
}

error() {
  printf "  %b%s%b %b\n" "${RED}" "${CROSSMARK}" "${NC}" "$*" >&2
}

fatal() {
  error "$@"
  exit 1
}

step() {
  local label="$1"; shift
  printf "\n%b[%s]%b %b\n" "${CYAN}" "${label}" "${NC}" "$*"
}

verbose() {
  [[ "$VERBOSE" -eq 1 ]] && printf "  %b%b%b\n" "${DIM}" "$*" "${NC}"
}

# ── Spinner ──────────────────────────────────────────────────

_spinner_pid=""

spinner_start() {
  local msg="${1:-处理中...}"
  if [[ ! -t 1 ]]; then
    printf "  %s\n" "$msg"
    return
  fi
  (
    local i=0
    local len=${#SPINNER_CHARS}
    while true; do
      printf "\r  %b%s%b %s" "${CYAN}" "${SPINNER_CHARS:i%len:1}" "${NC}" "$msg"
      i=$((i + 1))
      sleep 0.1
    done
  ) &
  _spinner_pid=$!
  disown "$_spinner_pid" 2>/dev/null || true
}

spinner_stop() {
  local result="${1:-0}"
  if [[ -n "${_spinner_pid}" ]]; then
    kill "$_spinner_pid" 2>/dev/null || true
    wait "$_spinner_pid" 2>/dev/null || true
    _spinner_pid=""
    printf "\r\033[K"
  fi
}

# ── Utilities ────────────────────────────────────────────────

generate_secret() {
  if command -v openssl &>/dev/null; then
    openssl rand -base64 32
  else
    head -c 32 /dev/urandom | base64
  fi
}

generate_password() {
  local len="${1:-24}"
  if command -v openssl &>/dev/null; then
    openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c "$len"
  else
    head -c 48 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c "$len"
  fi
}

prompt_value() {
  local prompt_text="$1"
  local default_val="${2:-}"
  local is_secret="${3:-false}"
  local result=""

  if [[ "$is_secret" == "true" ]]; then
    printf "  %b%s%b %b[自动生成]%b: " "${CYAN}" "${prompt_text}" "${NC}" "${DIM}" "${NC}" >&2
    read -r result </dev/tty
  elif [[ -n "$default_val" ]]; then
    printf "  %b%s%b %b[%s]%b: " "${CYAN}" "${prompt_text}" "${NC}" "${DIM}" "${default_val}" "${NC}" >&2
    read -r result </dev/tty
  else
    printf "  %b%s%b: " "${CYAN}" "${prompt_text}" "${NC}" >&2
    read -r result </dev/tty
  fi

  if [[ -z "$result" ]]; then
    echo "$default_val"
  else
    echo "$result"
  fi
}

confirm() {
  local prompt_text="$1"
  local default="${2:-y}"
  local hint="Y/n"
  [[ "$default" == "n" ]] && hint="y/N"

  printf "  %b%s%b [%s]: " "${CYAN}" "${prompt_text}" "${NC}" "${hint}" >&2
  read -r answer </dev/tty
  answer="${answer:-$default}"

  case "$answer" in
    [Yy]*) return 0 ;;
    *) return 1 ;;
  esac
}

read_env_value() {
  local key="$1"
  local file="${2:-.env}"
  if [[ -f "$file" ]]; then
    grep -E "^${key}=" "$file" 2>/dev/null | head -1 | sed 's/^[^=]*=//' | sed "s/^[\"']//" | sed "s/[\"']$//" || true
  fi
}

command_exists() {
  command -v "$1" &>/dev/null
}

version_gte() {
  printf '%s\n%s\n' "$2" "$1" | sort -t. -k1,1n -k2,2n -k3,3n -C
}

# ── Banner ───────────────────────────────────────────────────

print_banner() {
  echo ""
  printf "%b" "${BLUE}"
  cat << 'BANNER'
       _          _                 ____              ____
      / \   _ __ (_)_ __ ___   ___/ ___|  __ _  __ _/ ___|
     / _ \ | '_ \| | '_ ` _ \ / _ \___ \ / _` |/ _` \___ \
    / ___ \| | | | | | | | | | (_) |__) | (_| | (_| |___) |
   /_/   \_\_| |_|_|_| |_| |_|\___/____/ \__,_|\__,_|____/
BANNER
  printf "%b" "${NC}"
  echo ""
  printf "  %b%s%b  %bv%s%b\n" \
    "${BOLD}" "多租户私域素材管理平台" "${NC}" \
    "${DIM}" "${ANIMOSAAS_VERSION}" "${NC}"
  printf "  %b%s%b\n" "${DIM}" "${ANIMOSAAS_REPO}" "${NC}"
  echo ""
}

# ── Prerequisites Check ─────────────────────────────────────

check_prerequisites() {
  step "预检" "正在检查系统环境..."

  local failed=0

  # ── OS Info ──
  local os_info=""
  if [[ -f /etc/os-release ]]; then
    os_info=$(. /etc/os-release && echo "${PRETTY_NAME:-$ID}")
  else
    os_info="$(uname -s) $(uname -r)"
  fi
  success "操作系统: ${os_info} ($(uname -m))"

  # ── Docker ──
  if ! command_exists docker; then
    error "未检测到 Docker"
    printf "    安装 Docker: %bhttps://docs.docker.com/get-docker/%b\n" "${UNDERLINE}" "${NC}"
    failed=1
  else
    local docker_version
    docker_version=$(docker version --format '{{.Server.Version}}' 2>/dev/null || docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "unknown")
    if [[ "$docker_version" != "unknown" ]] && ! version_gte "$docker_version" "$ANIMOSAAS_MIN_DOCKER"; then
      warn "Docker 版本 ${docker_version}，建议 >= ${ANIMOSAAS_MIN_DOCKER}"
    else
      success "Docker: v${docker_version}"
    fi
  fi

  # ── Docker daemon ──
  if ! docker info &>/dev/null 2>&1; then
    error "Docker 守护进程未运行"
    if [[ "$(uname -s)" == "Linux" ]]; then
      printf "    尝试: %bsudo systemctl start docker%b\n" "${YELLOW}" "${NC}"
    fi
    failed=1
  fi

  # ── Docker Compose ──
  if docker compose version &>/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
    local compose_ver
    compose_ver=$(docker compose version --short 2>/dev/null || docker compose version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    success "Compose: v${compose_ver}"
  elif command_exists docker-compose; then
    COMPOSE_CMD="docker-compose"
    local compose_ver
    compose_ver=$(docker-compose version --short 2>/dev/null || echo "unknown")
    success "Compose: v${compose_ver} (独立版)"
  else
    error "未检测到 Docker Compose"
    failed=1
  fi

  # ── Disk space ──
  local available_mb
  available_mb=$(df -m "$(pwd)" 2>/dev/null | awk 'NR==2{print $4}' || echo "0")
  if [[ "$available_mb" -lt "$ANIMOSAAS_MIN_DISK_MB" ]] 2>/dev/null; then
    warn "磁盘空间不足: 剩余 ${available_mb}MB（建议 >= ${ANIMOSAAS_MIN_DISK_MB}MB）"
  else
    local available_gb
    available_gb=$(awk "BEGIN {printf \"%.1f\", ${available_mb}/1024}")
    success "磁盘空间: 剩余 ${available_gb}GB"
  fi

  # ── Memory ──
  local total_mem_mb=0
  if [[ -f /proc/meminfo ]]; then
    total_mem_mb=$(awk '/MemTotal/{printf "%.0f", $2/1024}' /proc/meminfo)
  elif command_exists sysctl; then
    total_mem_mb=$(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1048576 ))
  fi
  if [[ "$total_mem_mb" -gt 0 ]] 2>/dev/null; then
    local total_mem_gb
    total_mem_gb=$(awk "BEGIN {printf \"%.1f\", ${total_mem_mb}/1024}")
    if [[ "$total_mem_mb" -lt 1024 ]]; then
      warn "内存: ${total_mem_gb}GB（建议 >= 1GB）"
    else
      success "内存: ${total_mem_gb}GB"
    fi
  fi

  # ── Port conflicts ──
  local app_port
  app_port=$(read_env_value "APP_PORT")
  app_port="${app_port:-3000}"
  if command_exists ss; then
    if ss -tlnp 2>/dev/null | grep -q ":${app_port} "; then
      warn "端口 ${app_port} 已被占用"
    fi
  elif command_exists lsof; then
    if lsof -i ":${app_port}" &>/dev/null; then
      warn "端口 ${app_port} 已被占用"
    fi
  fi

  if [[ "$failed" -ne 0 ]]; then
    echo ""
    fatal "预检未通过，请先解决以上问题后重试。"
  fi
}

# ── Wizard Setup (First Run) ────────────────────────────────

wizard_setup() {
  echo ""
  printf "  %b┌─────────────────────────────────────────────┐%b\n" "${BOLD}" "${NC}"
  printf "  %b│          首次部署 · 配置向导                │%b\n" "${BOLD}" "${NC}"
  printf "  %b└─────────────────────────────────────────────┘%b\n" "${BOLD}" "${NC}"
  echo ""
  printf "  %b按 Enter 接受 [默认值]，或输入自定义值%b\n" "${DIM}" "${NC}"

  # ── Database ──
  echo ""
  printf "  %b%s 数据库配置%b\n" "${BOLD}${MAGENTA}" "${ARROW}" "${NC}"
  local db_password
  db_password=$(generate_password 24)
  db_password=$(prompt_value "数据库密码" "$db_password")
  local db_port
  db_port=$(prompt_value "数据库端口" "5432")

  # ── Security ──
  echo ""
  printf "  %b%s 安全配置%b\n" "${BOLD}${MAGENTA}" "${ARROW}" "${NC}"
  local jwt_secret
  jwt_secret=$(generate_secret)
  jwt_secret=$(prompt_value "JWT 密钥（>=32 字符）" "$jwt_secret" "true")
  if [[ -z "$jwt_secret" ]]; then
    jwt_secret=$(generate_secret)
  fi
  local admin_password
  admin_password=$(prompt_value "管理员密码" "AnimoAdmin123!")

  # ── Super Admin ──
  echo ""
  printf "  %b%s 超级管理员%b\n" "${BOLD}${MAGENTA}" "${ARROW}" "${NC}"
  local super_email
  super_email=$(prompt_value "超级管理员邮箱" "superadmin@animosaas.com")
  local super_password
  super_password=$(prompt_value "超级管理员密码" "SuperAdmin123!")

  # ── Application ──
  echo ""
  printf "  %b%s 应用配置%b\n" "${BOLD}${MAGENTA}" "${ARROW}" "${NC}"
  local app_port
  app_port=$(prompt_value "应用端口" "3000")
  local app_url
  app_url=$(prompt_value "应用地址" "http://localhost:${app_port}")
  local tenant_mode
  tenant_mode=$(prompt_value "租户模式（subdomain/path/header）" "path")
  local tenant_name
  tenant_name=$(prompt_value "默认租户名称" "Default")

  # ── Write .env ──
  echo ""
  cat > .env << ENVEOF
# ─────────────────────────────────────────────────────────────
# AnimoSaaS 部署配置
# 由部署向导自动生成于 $(date '+%Y-%m-%d %H:%M:%S')
# ─────────────────────────────────────────────────────────────

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

  success ".env 配置已保存"
}

# ── Validate Existing .env ───────────────────────────────────

validate_existing_env() {
  step "配置" "正在校验已有 .env 文件..."

  local has_error=0

  local jwt_secret
  jwt_secret=$(read_env_value "JWT_SECRET")
  local db_password
  db_password=$(read_env_value "DB_PASSWORD")

  if [[ -z "$jwt_secret" ]]; then
    error "缺少 JWT_SECRET"
    has_error=1
  elif [[ ${#jwt_secret} -lt 32 ]]; then
    error "JWT_SECRET 长度不足（当前 ${#jwt_secret} 字符，需要 >= 32）"
    has_error=1
  else
    success "JWT_SECRET: 合法"
  fi

  if [[ -z "$db_password" ]]; then
    warn "DB_PASSWORD 未设置，将使用 docker-compose 默认值"
  else
    success "DB_PASSWORD: 已设置"
  fi

  if [[ "$has_error" -eq 1 ]]; then
    echo ""
    fatal "配置校验失败。请修复 .env 文件，或删除后重新运行向导。"
  fi

  success "配置校验通过"
}

# ── Volume Conflict Detection ────────────────────────────────

check_volume_conflict() {
  local project_name
  project_name=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
  local full_volume="${project_name}_postgres_data"

  if docker volume inspect "$full_volume" &>/dev/null 2>&1; then
    echo ""
    warn "检测到已有数据库数据卷: ${BOLD}${full_volume}${NC}"
    echo ""
    printf "    %bPostgreSQL 会在首次启动时将密码固化到数据卷中。%b\n" "${YELLOW}" "${NC}"
    printf "    %b如果 .env 中的 DB_PASSWORD 与卷内密码不一致，将导致认证失败。%b\n" "${YELLOW}" "${NC}"
    echo ""
    if confirm "是否清除旧数据卷并重新初始化？（数据将丢失）" "y"; then
      spinner_start "正在清除旧容器和数据卷..."
      $COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true
      spinner_stop
      success "旧数据已清除"
    else
      echo ""
      info "已保留旧数据卷。如遇认证错误，请运行 ${BOLD}./deploy.sh --reset${NC}"
    fi
  fi
}

# ── Setup Entry Point ────────────────────────────────────────

setup_env() {
  if [[ -f .env ]]; then
    validate_existing_env
    check_volume_conflict
  else
    wizard_setup
    check_volume_conflict
  fi
}

# ── Progress Bar ─────────────────────────────────────────────

progress_bar() {
  local current="$1"
  local total="$2"
  local width=40
  local pct=$((current * 100 / total))
  local filled=$((current * width / total))
  local empty=$((width - filled))
  local bar=""
  local i

  for ((i = 0; i < filled; i++)); do bar+="█"; done
  for ((i = 0; i < empty; i++)); do bar+="░"; done

  printf "\r  %b%s%b %3d%% [%s]" "${CYAN}" "${ARROW}" "${NC}" "$pct" "$bar"
}

# ── Deploy ───────────────────────────────────────────────────

deploy() {
  step "构建" "正在构建 Docker 镜像..."

  spinner_start "正在构建镜像（首次构建可能需要几分钟）..."
  local build_output
  if build_output=$($COMPOSE_CMD build --no-cache 2>&1); then
    spinner_stop
    success "镜像构建完成"
  else
    spinner_stop
    error "镜像构建失败"
    if [[ "$VERBOSE" -eq 1 ]]; then
      echo "$build_output"
    else
      echo "$build_output" | tail -10
      info "添加 ${BOLD}--verbose${NC} 参数可查看完整构建日志"
    fi
    exit 1
  fi

  step "启动" "正在启动服务..."

  spinner_start "正在启动容器..."
  $COMPOSE_CMD up -d 2>/dev/null
  spinner_stop
  success "容器已启动"

  # ── Health check with progress ──
  step "就绪" "等待服务就绪..."

  local max_wait=$ANIMOSAAS_HEALTH_TIMEOUT
  local elapsed=0
  local status="starting"

  while [[ $elapsed -lt $max_wait ]]; do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$ANIMOSAAS_CONTAINER_APP" 2>/dev/null || echo "starting")

    if [[ "$status" == "healthy" ]]; then
      break
    fi

    # Fast-fail on crash loop
    if [[ $elapsed -ge 30 ]]; then
      local restart_count
      restart_count=$(docker inspect --format='{{.RestartCount}}' "$ANIMOSAAS_CONTAINER_APP" 2>/dev/null || echo "0")
      if [[ "$restart_count" -ge 5 ]] 2>/dev/null; then
        printf "\r\033[K"
        error "容器持续崩溃重启（已重启 ${restart_count} 次）"
        status="crash-loop"
        break
      fi
    fi

    progress_bar "$elapsed" "$max_wait"
    printf " %b%s%b" "${DIM}" "${status}" "${NC}"
    sleep 5
    elapsed=$((elapsed + 5))
  done
  printf "\r\033[K"

  local app_port
  app_port=$(read_env_value "APP_PORT")
  app_port="${app_port:-3000}"

  if [[ "$status" == "healthy" ]]; then
    print_success "$app_port"
  else
    print_failure "$max_wait"
  fi
}

# ── Success Output ───────────────────────────────────────────

print_success() {
  local port="$1"
  echo ""
  printf "  %b" "${GREEN}"
  cat << 'EOF'
  ┌───────────────────────────────────────────────┐
  │                                               │
  │           部署成功，服务已就绪！               │
  │                                               │
  └───────────────────────────────────────────────┘
EOF
  printf "  %b" "${NC}"
  echo ""
  printf "  %b%-20s%b %b%s%b\n" "${DIM}" "前台地址:" "${NC}" "${UNDERLINE}${BLUE}" "http://localhost:${port}" "${NC}"
  printf "  %b%-20s%b %b%s%b\n" "${DIM}" "管理后台:" "${NC}" "${UNDERLINE}${BLUE}" "http://localhost:${port}/admin/login" "${NC}"
  printf "  %b%-20s%b %b%s%b\n" "${DIM}" "超级管理员:" "${NC}" "${UNDERLINE}${BLUE}" "http://localhost:${port}/superadmin/login" "${NC}"
  printf "  %b%-20s%b %b%s%b\n" "${DIM}" "健康检查:" "${NC}" "${UNDERLINE}${BLUE}" "http://localhost:${port}/api/health" "${NC}"
  echo ""
  printf "  %b%-20s%b %s\n" "${DIM}" "查看日志:" "${NC}" "./deploy.sh --logs"
  printf "  %b%-20s%b %s\n" "${DIM}" "停止服务:" "${NC}" "./deploy.sh --stop"
  printf "  %b%-20s%b %s\n" "${DIM}" "服务状态:" "${NC}" "./deploy.sh --status"
  echo ""
}

# ── Failure Output ───────────────────────────────────────────

print_failure() {
  local max_wait="$1"
  echo ""
  printf "  %b" "${RED}"
  cat << 'EOF'
  ┌───────────────────────────────────────────────┐
  │                                               │
  │             部署失败                           │
  │                                               │
  └───────────────────────────────────────────────┘
EOF
  printf "  %b" "${NC}"
  printf "  %b服务在 %d 秒内未能正常启动%b\n" "${RED}" "$max_wait" "${NC}"
  echo ""

  # ── Diagnostics ──
  step "诊断" "正在收集诊断信息..."
  echo ""

  printf "  %b%-16s%b " "${BOLD}" "数据库:" "${NC}"
  docker inspect --format='状态={{.State.Status}} 健康={{.State.Health.Status}}' "$ANIMOSAAS_CONTAINER_DB" 2>/dev/null || printf "容器不存在"
  echo ""

  printf "  %b%-16s%b " "${BOLD}" "应用:" "${NC}"
  docker inspect --format='状态={{.State.Status}} 重启次数={{.RestartCount}}' "$ANIMOSAAS_CONTAINER_APP" 2>/dev/null || printf "容器不存在"
  echo ""
  echo ""

  printf "  %b── 最近的应用日志 ──%b\n" "${YELLOW}" "${NC}"
  $COMPOSE_CMD logs app --tail 20 2>/dev/null || true
  echo ""

  # ── Smart diagnostics ──
  printf "  %b── 自动诊断 ──%b\n" "${BOLD}" "${NC}"
  local app_logs
  app_logs=$($COMPOSE_CMD logs app --tail 50 2>/dev/null || true)

  if echo "$app_logs" | grep -qi "Authentication failed\|P1000\|password authentication failed"; then
    error "检测到数据库认证失败"
    printf "    %b原因: .env 中的 DB_PASSWORD 与数据卷内的密码不一致%b\n" "${YELLOW}" "${NC}"
    printf "    %b修复: ./deploy.sh --reset%b\n" "${YELLOW}" "${NC}"
  elif echo "$app_logs" | grep -qi "ECONNREFUSED\|Connection refused"; then
    error "检测到数据库连接被拒绝"
    printf "    %b原因: 数据库容器可能未正常启动%b\n" "${YELLOW}" "${NC}"
    printf "    %b修复: $COMPOSE_CMD logs db%b\n" "${YELLOW}" "${NC}"
  elif echo "$app_logs" | grep -qi "JWT_SECRET\|Missing.*environment"; then
    error "检测到环境变量缺失"
    printf "    %b修复: 检查 .env 文件完整性，或删除后重新运行向导%b\n" "${YELLOW}" "${NC}"
  else
    warn "未匹配到已知错误模式，请查看上方日志排查"
  fi

  echo ""
  printf "  %b手动排查:%b\n" "${BOLD}" "${NC}"
  printf "    完整日志:    %b$COMPOSE_CMD logs app%b\n" "${DIM}" "${NC}"
  printf "    进入容器:    %bdocker exec -it %s bash%b\n" "${DIM}" "$ANIMOSAAS_CONTAINER_APP" "${NC}"
  printf "    完全重置:    %b./deploy.sh --reset%b\n" "${DIM}" "${NC}"
  echo ""
}

# ── Sub-commands ─────────────────────────────────────────────

cmd_update() {
  step "更新" "正在拉取最新代码并重新构建..."

  if command_exists git && [[ -d .git ]]; then
    spinner_start "正在拉取最新代码..."
    git pull origin main 2>/dev/null && spinner_stop && success "代码已更新" || { spinner_stop; warn "Git pull 已跳过"; }
  fi

  spinner_start "正在停止服务..."
  $COMPOSE_CMD down 2>/dev/null
  spinner_stop

  spinner_start "正在重新构建镜像..."
  $COMPOSE_CMD build --no-cache 2>/dev/null
  spinner_stop
  success "镜像重建完成"

  spinner_start "正在启动服务..."
  $COMPOSE_CMD up -d 2>/dev/null
  spinner_stop
  success "服务已重启"

  echo ""
  success "更新完成"
}

cmd_stop() {
  step "停止" "正在停止所有服务..."

  spinner_start "正在停止容器..."
  $COMPOSE_CMD down 2>/dev/null
  spinner_stop
  success "所有服务已停止"
}

cmd_reset() {
  echo ""
  printf "  %b" "${RED}"
  cat << 'EOF'
  ┌───────────────────────────────────────────────┐
  │                                               │
  │  警告：此操作将销毁所有数据！                 │
  │                                               │
  │  · 停止并移除所有容器                         │
  │  · 删除数据库数据卷（全部数据）               │
  │  · 删除 .env 配置文件                         │
  │                                               │
  └───────────────────────────────────────────────┘
EOF
  printf "  %b" "${NC}"
  echo ""
  printf "  输入 %bYES%b 确认重置: " "${BOLD}" "${NC}" >&2
  read -r confirm_input </dev/tty
  if [[ "$confirm_input" != "YES" ]]; then
    info "已取消重置"
    exit 0
  fi

  step "重置" "正在清理..."

  spinner_start "正在移除容器和数据卷..."
  $COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true
  spinner_stop

  rm -f .env
  success "重置完成"
  echo ""
  info "运行 ${BOLD}./deploy.sh${NC} 重新开始向导式部署。"
  echo ""
}

cmd_logs() {
  $COMPOSE_CMD logs -f --tail=100
}

cmd_status() {
  step "状态" "服务运行概览"
  echo ""

  # ── Container status table ──
  printf "  %b%-24s %-12s %-12s %-10s%b\n" "${BOLD}" "容器" "运行状态" "健康状态" "运行时长" "${NC}"
  printf "  %b────────────────────────────────────────────────────────────%b\n" "${DIM}" "${NC}"

  for container in "$ANIMOSAAS_CONTAINER_DB" "$ANIMOSAAS_CONTAINER_APP"; do
    local status health uptime
    status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "未找到")
    health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "-")
    uptime=$(docker inspect --format='{{.State.StartedAt}}' "$container" 2>/dev/null || echo "-")

    local color="$RED"
    [[ "$status" == "running" ]] && color="$GREEN"

    # Calculate uptime
    local uptime_str="-"
    if [[ "$status" == "running" && "$uptime" != "-" ]]; then
      local started_epoch now_epoch diff_sec
      started_epoch=$(date -d "$uptime" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${uptime%%.*}" +%s 2>/dev/null || echo "0")
      now_epoch=$(date +%s)
      if [[ "$started_epoch" -gt 0 ]]; then
        diff_sec=$((now_epoch - started_epoch))
        if [[ $diff_sec -lt 60 ]]; then
          uptime_str="${diff_sec}秒"
        elif [[ $diff_sec -lt 3600 ]]; then
          uptime_str="$((diff_sec / 60))分钟"
        elif [[ $diff_sec -lt 86400 ]]; then
          uptime_str="$((diff_sec / 3600))时$((diff_sec % 3600 / 60))分"
        else
          uptime_str="$((diff_sec / 86400))天$((diff_sec % 86400 / 3600))时"
        fi
      fi
    fi

    local health_color="$DIM"
    [[ "$health" == "healthy" ]] && health_color="$GREEN"
    [[ "$health" == "unhealthy" ]] && health_color="$RED"

    printf "  %-24s %b%-12s%b %b%-12s%b %-10s\n" \
      "$container" "$color" "$status" "$NC" "$health_color" "$health" "$NC" "$uptime_str"
  done

  echo ""

  # ── Health endpoint ──
  local app_port
  app_port=$(read_env_value "APP_PORT")
  app_port="${app_port:-3000}"
  printf "  %b健康检查端点:%b " "${BOLD}" "${NC}"
  local health_resp
  health_resp=$(curl -sf "http://localhost:${app_port}/api/health" 2>/dev/null) && {
    if command_exists python3; then
      echo "$health_resp" | python3 -m json.tool 2>/dev/null || echo "$health_resp"
    else
      echo "$health_resp"
    fi
  } || printf "%b无法连接%b\n" "${RED}" "${NC}"
  echo ""
}

cmd_backup() {
  step "备份" "正在创建数据库备份..."

  local timestamp
  timestamp=$(date '+%Y%m%d_%H%M%S')
  local backup_file="backups/animosaas_${timestamp}.sql.gz"

  mkdir -p backups

  spinner_start "正在导出数据库..."
  if docker exec "$ANIMOSAAS_CONTAINER_DB" pg_dump -U animosaas animosaas_db 2>/dev/null | gzip > "$backup_file"; then
    spinner_stop
    local size
    size=$(du -h "$backup_file" 2>/dev/null | cut -f1)
    success "备份已保存: ${backup_file}（${size}）"
  else
    spinner_stop
    rm -f "$backup_file"
    error "备份失败，请确认数据库容器正在运行。"
  fi
  echo ""
}

# ── Help ─────────────────────────────────────────────────────

cmd_help() {
  printf "\n"
  printf "  %bAnimoSaaS 部署工具%b v%s\n" "${BOLD}" "${NC}" "${ANIMOSAAS_VERSION}"
  printf "  %b多租户私域素材管理平台%b\n" "${DIM}" "${NC}"
  printf "\n"
  printf "  %b用法%b\n" "${BOLD}${YELLOW}" "${NC}"
  printf "    ./deploy.sh [命令] [参数]\n"
  printf "\n"
  printf "  %b命令%b\n" "${BOLD}${YELLOW}" "${NC}"
  printf "    %-20s %s\n" "（默认）"       "向导式部署（首次）/ 校验并启动（已配置）"
  printf "    %-20s %s\n" "--update, -u"   "拉取最新代码并重新构建"
  printf "    %-20s %s\n" "--stop, -s"     "停止所有服务"
  printf "    %-20s %s\n" "--reset"        "完全重置（销毁所有数据和配置）"
  printf "    %-20s %s\n" "--logs, -l"     "实时查看服务日志"
  printf "    %-20s %s\n" "--status"       "查看服务状态仪表盘"
  printf "    %-20s %s\n" "--backup, -b"   "创建数据库备份"
  printf "    %-20s %s\n" "--help, -h"     "显示此帮助信息"
  printf "\n"
  printf "  %b参数%b\n" "${BOLD}${YELLOW}" "${NC}"
  printf "    %-20s %s\n" "--verbose, -v"  "显示详细输出"
  printf "\n"
  printf "  %b示例%b\n" "${BOLD}${YELLOW}" "${NC}"
  printf "    %-40s %s\n" "./deploy.sh"           "# 首次向导式部署"
  printf "    %-40s %s\n" "./deploy.sh --update"   "# 更新到最新版本"
  printf "    %-40s %s\n" "./deploy.sh --logs"     "# 实时查看日志"
  printf "    %-40s %s\n" "./deploy.sh --status"   "# 查看服务健康状态"
  printf "    %-40s %s\n" "./deploy.sh --backup"   "# 备份数据库"
  printf "\n"
  printf "  %b文档与支持%b\n" "${BOLD}${YELLOW}" "${NC}"
  printf "    项目仓库:    %s\n" "${ANIMOSAAS_REPO}"
  printf "    问题反馈:    %s/issues\n" "${ANIMOSAAS_REPO%.git}"
  printf "\n"
}

# ── Main ─────────────────────────────────────────────────────

main() {
  # Parse global flags
  local cmd=""
  local args=()
  for arg in "$@"; do
    case "$arg" in
      --verbose|-v) VERBOSE=1 ;;
      *) args+=("$arg") ;;
    esac
  done

  print_banner

  # Switch to script directory
  cd "$(dirname "${BASH_SOURCE[0]}")"
  SCRIPT_DIR="$(pwd)"

  cmd="${args[0]:-}"

  # Help doesn't need prerequisite checks
  case "$cmd" in
    --help|-h)
      cmd_help
      exit 0
      ;;
  esac

  check_prerequisites

  case "$cmd" in
    --update|-u)  cmd_update  ;;
    --stop|-s)    cmd_stop    ;;
    --reset)      cmd_reset   ;;
    --logs|-l)    cmd_logs    ;;
    --status)     cmd_status  ;;
    --backup|-b)  cmd_backup  ;;
    "")
      setup_env
      deploy
      ;;
    *)
      error "未知命令: $cmd"
      cmd_help
      exit 1
      ;;
  esac
}

# Trap for cleanup
trap 'spinner_stop 2>/dev/null; exit' INT TERM

main "$@"
