/**
 * 统一日志系统
 *
 * 功能：
 * - 结构化日志输出（开发环境可读格式，生产环境 JSON）
 * - 日志级别控制（LOG_LEVEL 环境变量）
 * - 模块标签
 * - 请求计数器（用于基础监控）
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  error: '\x1b[31m', // 红
  warn: '\x1b[33m', // 黄
  info: '\x1b[36m', // 青
  debug: '\x1b[90m', // 灰
};

const RESET = '\x1b[0m';

function getLogLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL || 'info').toLowerCase();
  if (env in LEVEL_PRIORITY) return env as LogLevel;
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[getLogLevel()];
}

function formatMessage(
  level: LogLevel,
  module: string,
  message: string,
  meta?: Record<string, any>
): string {
  const timestamp = new Date().toISOString();
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    // 生产环境：JSON 格式，便于日志收集
    return JSON.stringify({
      timestamp,
      level,
      module,
      message,
      ...meta,
    });
  }

  // 开发环境：可读格式
  const color = LEVEL_COLORS[level];
  const levelStr = level.toUpperCase().padEnd(5);
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${color}[${timestamp}] ${levelStr}${RESET} [${module}] ${message}${metaStr}`;
}

function log(level: LogLevel, module: string, message: string, meta?: Record<string, any>) {
  if (!shouldLog(level)) return;

  const formatted = formatMessage(level, module, message, meta);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/**
 * 创建模块级 logger
 */
export function createLogger(module: string) {
  return {
    error: (message: string, meta?: Record<string, any>) => log('error', module, message, meta),
    warn: (message: string, meta?: Record<string, any>) => log('warn', module, message, meta),
    info: (message: string, meta?: Record<string, any>) => log('info', module, message, meta),
    debug: (message: string, meta?: Record<string, any>) => log('debug', module, message, meta),
  };
}

// ============================================================
// 请求统计（内存级，进程重启后重置）
// ============================================================

interface RequestStats {
  total: number;
  errors: number;
  byPath: Map<string, number>;
  byStatus: Map<number, number>;
  startedAt: Date;
}

const stats: RequestStats = {
  total: 0,
  errors: 0,
  byPath: new Map(),
  byStatus: new Map(),
  startedAt: new Date(),
};

/**
 * 记录一次请求
 */
export function recordRequest(path: string, status: number) {
  stats.total++;
  if (status >= 400) stats.errors++;

  stats.byPath.set(path, (stats.byPath.get(path) || 0) + 1);
  stats.byStatus.set(status, (stats.byStatus.get(status) || 0) + 1);
}

/**
 * 获取请求统计
 */
export function getRequestStats() {
  const uptimeMs = Date.now() - stats.startedAt.getTime();
  const uptimeHours = uptimeMs / 3600000;

  return {
    total: stats.total,
    errors: stats.errors,
    errorRate: stats.total > 0 ? ((stats.errors / stats.total) * 100).toFixed(2) + '%' : '0%',
    requestsPerHour: uptimeHours > 0 ? Math.round(stats.total / uptimeHours) : 0,
    topPaths: Array.from(stats.byPath.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count })),
    statusDistribution: Object.fromEntries(stats.byStatus),
    startedAt: stats.startedAt.toISOString(),
    uptimeSeconds: Math.floor(uptimeMs / 1000),
  };
}

/**
 * 获取系统资源信息
 */
export function getSystemInfo() {
  const mem = process.memoryUsage();
  return {
    memory: {
      rss: Math.round(mem.rss / 1048576),
      heapUsed: Math.round(mem.heapUsed / 1048576),
      heapTotal: Math.round(mem.heapTotal / 1048576),
      external: Math.round(mem.external / 1048576),
      unit: 'MB',
    },
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
  };
}

// 默认 logger
export const logger = createLogger('app');
