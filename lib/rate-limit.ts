import { NextResponse } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const ipCache = new Map<string, { count: number; expiresAt: number }>();

// 不同端点的速率限制配置
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 15分钟5次
  admin: { maxRequests: 100, windowMs: 60 * 1000 }, // 1分钟100次
  api: { maxRequests: 60, windowMs: 60 * 1000 }, // 1分钟60次
  download: { maxRequests: 10, windowMs: 60 * 1000 }, // 1分钟10次
  upload: { maxRequests: 5, windowMs: 60 * 1000 }, // 1分钟5次
};

/**
 * 检查速率限制
 * @param ip 客户端 IP 地址
 * @param type 限制类型
 * @returns 如果超过限制返回错误响应，否则返回 null
 */
export function checkRateLimit(ip: string, type: keyof typeof RATE_LIMITS = 'api') {
  const config = RATE_LIMITS[type];
  const now = Date.now();
  const key = `${ip}:${type}`;
  const record = ipCache.get(key);

  // 定期清理过期记录（防止内存泄漏）
  if (ipCache.size > 10000) {
    for (const [k, v] of ipCache.entries()) {
      if (now > v.expiresAt) {
        ipCache.delete(k);
      }
    }
  }

  if (!record) {
    ipCache.set(key, { count: 1, expiresAt: now + config.windowMs });
    return null;
  }

  if (now > record.expiresAt) {
    ipCache.set(key, { count: 1, expiresAt: now + config.windowMs });
    return null;
  }

  if (record.count >= config.maxRequests) {
    return NextResponse.json(
      {
        success: false,
        error: '请求过于频繁，请稍后再试',
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((record.expiresAt - now) / 1000).toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(record.expiresAt).toISOString(),
        },
      }
    );
  }

  record.count += 1;
  return null;
}

/**
 * 从请求中获取客户端 IP
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

/**
 * 获取速率限制信息（用于响应头）
 */
export function getRateLimitInfo(
  ip: string,
  type: keyof typeof RATE_LIMITS = 'api'
): {
  limit: number;
  remaining: number;
  reset: number;
} {
  const config = RATE_LIMITS[type];
  const key = `${ip}:${type}`;
  const record = ipCache.get(key);
  const now = Date.now();

  if (!record || now > record.expiresAt) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: now + config.windowMs,
    };
  }

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    reset: record.expiresAt,
  };
}
