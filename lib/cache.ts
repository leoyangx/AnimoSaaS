/**
 * 通用内存缓存
 * 支持 TTL 过期、LRU 淘汰、请求去重
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  accessedAt: number;
}

export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private pending = new Map<string, Promise<T>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: { maxSize?: number; defaultTTL?: number } = {}) {
    this.maxSize = options.maxSize || 500;
    this.defaultTTL = options.defaultTTL || 60 * 1000; // 默认 1 分钟
  }

  /**
   * 获取缓存值
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    // 更新访问时间（LRU）
    entry.accessedAt = Date.now();
    return entry.data;
  }

  /**
   * 设置缓存值
   */
  set(key: string, value: T, ttl?: number): void {
    // LRU 淘汰：如果缓存已满，移除最久未访问的条目
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
      accessedAt: Date.now(),
    });
  }

  /**
   * 获取或计算（带请求去重）
   * 如果相同 key 的请求正在进行中，会复用同一个 Promise
   */
  async getOrSet(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    // 检查缓存
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    // 请求去重：检查是否有正在进行的相同请求
    const pendingRequest = this.pending.get(key);
    if (pendingRequest) return pendingRequest;

    // 创建新请求
    const promise = factory()
      .then((value) => {
        this.set(key, value, ttl);
        this.pending.delete(key);
        return value;
      })
      .catch((error) => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 按前缀删除缓存（用于批量失效）
   */
  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }

  /**
   * 获取缓存统计
   */
  stats() {
    let expired = 0;
    const now = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.expiresAt < now) expired++;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      pending: this.pending.size,
      expired,
    };
  }

  /**
   * 淘汰最久未访问的条目
   */
  private evict(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // 先清理过期的
      if (entry.expiresAt < Date.now()) {
        this.cache.delete(key);
        return;
      }
      if (entry.accessedAt < oldestTime) {
        oldestTime = entry.accessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// ==================== 预配置的缓存实例 ====================

/** 租户配置缓存 - 5 分钟 TTL */
export const configCache = new MemoryCache({ maxSize: 100, defaultTTL: 5 * 60 * 1000 });

/** 素材列表缓存 - 2 分钟 TTL */
export const assetCache = new MemoryCache({ maxSize: 200, defaultTTL: 2 * 60 * 1000 });

/** 分类列表缓存 - 10 分钟 TTL */
export const categoryCache = new MemoryCache({ maxSize: 50, defaultTTL: 10 * 60 * 1000 });

/** API 响应缓存 - 30 秒 TTL */
export const apiCache = new MemoryCache({ maxSize: 300, defaultTTL: 30 * 1000 });
