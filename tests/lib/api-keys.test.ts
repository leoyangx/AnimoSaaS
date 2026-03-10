import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey, checkApiKeyPermission, API_PERMISSIONS } from '@/lib/api-keys';

describe('API Key 工具库', () => {
  describe('generateApiKey', () => {
    it('应生成 ak_ 前缀的密钥', () => {
      const { fullKey, prefix } = generateApiKey();
      expect(fullKey).toMatch(/^ak_[a-f0-9]{64}$/);
      expect(prefix).toMatch(/^ak_[a-f0-9]{8}\.\.\.$/);
    });

    it('每次生成的密钥应不同', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1.fullKey).not.toBe(key2.fullKey);
    });

    it('前缀应为密钥的前 8 个字符', () => {
      const { fullKey, prefix } = generateApiKey();
      const expectedPrefix = `ak_${fullKey.substring(3, 11)}...`;
      expect(prefix).toBe(expectedPrefix);
    });
  });

  describe('hashApiKey', () => {
    it('应返回 64 位十六进制 SHA-256 哈希', () => {
      const hash = hashApiKey('ak_test123');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('相同输入应返回相同哈希', () => {
      const hash1 = hashApiKey('ak_same_key');
      const hash2 = hashApiKey('ak_same_key');
      expect(hash1).toBe(hash2);
    });

    it('不同输入应返回不同哈希', () => {
      const hash1 = hashApiKey('ak_key1');
      const hash2 = hashApiKey('ak_key2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('checkApiKeyPermission', () => {
    it('应匹配精确权限', () => {
      expect(checkApiKeyPermission(['assets:read'], 'assets:read')).toBe(true);
      expect(checkApiKeyPermission(['assets:read'], 'assets:write')).toBe(false);
    });

    it('应支持 scope 通配符', () => {
      expect(checkApiKeyPermission(['assets:*'], 'assets:read')).toBe(true);
      expect(checkApiKeyPermission(['assets:*'], 'assets:write')).toBe(true);
      expect(checkApiKeyPermission(['assets:*'], 'assets:delete')).toBe(true);
      expect(checkApiKeyPermission(['assets:*'], 'users:read')).toBe(false);
    });

    it('应支持全局通配符', () => {
      expect(checkApiKeyPermission(['*'], 'assets:read')).toBe(true);
      expect(checkApiKeyPermission(['*'], 'users:read')).toBe(true);
      expect(checkApiKeyPermission(['*'], 'download:read')).toBe(true);
    });

    it('应处理多个权限', () => {
      const perms = ['assets:read', 'categories:read', 'download:read'];
      expect(checkApiKeyPermission(perms, 'assets:read')).toBe(true);
      expect(checkApiKeyPermission(perms, 'categories:read')).toBe(true);
      expect(checkApiKeyPermission(perms, 'download:read')).toBe(true);
      expect(checkApiKeyPermission(perms, 'assets:write')).toBe(false);
      expect(checkApiKeyPermission(perms, 'users:read')).toBe(false);
    });

    it('空权限列表应全部拒绝', () => {
      expect(checkApiKeyPermission([], 'assets:read')).toBe(false);
    });
  });

  describe('API_PERMISSIONS', () => {
    it('应包含所有预定义权限', () => {
      const keys = Object.keys(API_PERMISSIONS);
      expect(keys).toContain('assets:read');
      expect(keys).toContain('assets:write');
      expect(keys).toContain('assets:delete');
      expect(keys).toContain('categories:read');
      expect(keys).toContain('download:read');
      expect(keys.length).toBeGreaterThanOrEqual(8);
    });
  });
});
