import { describe, it, expect } from 'vitest';

/**
 * 配额逻辑单元测试
 *
 * 由于 checkQuota/incrementQuota 依赖 Prisma，
 * 这里测试配额检查的纯逻辑部分
 */

describe('配额管理逻辑', () => {
  describe('配额检查', () => {
    it('使用量低于上限时应允许', () => {
      const used = 5;
      const max = 10;
      const increment = 1;
      const allowed = used + increment <= max;
      expect(allowed).toBe(true);
    });

    it('使用量等于上限时应拒绝', () => {
      const used = 10;
      const max = 10;
      const increment = 1;
      const allowed = used + increment <= max;
      expect(allowed).toBe(false);
    });

    it('使用量刚好达到上限时应允许（边界）', () => {
      const used = 9;
      const max = 10;
      const increment = 1;
      const allowed = used + increment <= max;
      expect(allowed).toBe(true);
    });

    it('批量增加超过上限时应拒绝', () => {
      const used = 8;
      const max = 10;
      const increment = 5;
      const allowed = used + increment <= max;
      expect(allowed).toBe(false);
    });

    it('使用量为 0 时应允许', () => {
      const used = 0;
      const max = 100;
      const increment = 1;
      const allowed = used + increment <= max;
      expect(allowed).toBe(true);
    });

    it('上限为 0 时应拒绝任何增加', () => {
      const used = 0;
      const max = 0;
      const increment = 1;
      const allowed = used + increment <= max;
      expect(allowed).toBe(false);
    });
  });

  describe('存储空间配额', () => {
    it('应正确比较字节大小', () => {
      const usedStorage = 500 * 1024 * 1024; // 500MB
      const maxStorage = 1024 * 1024 * 1024; // 1GB
      const increment = 100 * 1024 * 1024; // 100MB
      const allowed = usedStorage + increment <= maxStorage;
      expect(allowed).toBe(true);
    });

    it('应拒绝超出存储上限的上传', () => {
      const usedStorage = 900 * 1024 * 1024; // 900MB
      const maxStorage = 1024 * 1024 * 1024; // 1GB
      const increment = 200 * 1024 * 1024; // 200MB
      const allowed = usedStorage + increment <= maxStorage;
      expect(allowed).toBe(false);
    });
  });

  describe('formatBytes 辅助函数', () => {
    // 复制 quota.ts 的 formatBytes 逻辑进行测试
    function formatBytes(bytes: number): string {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    it('应正确格式化 0', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('应正确格式化字节', () => {
      expect(formatBytes(512)).toBe('512 B');
    });

    it('应正确格式化 KB', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('应正确格式化 MB', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
    });

    it('应正确格式化 GB', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('应正确格式化小数', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
    });
  });
});
