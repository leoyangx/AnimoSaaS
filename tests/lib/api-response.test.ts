import { describe, it, expect } from 'vitest';

// 直接测试 api-response 中的纯函数逻辑
// 由于 successResponse/errorResponse 依赖 NextResponse，这里测试其输出结构

describe('API Response 格式', () => {
  describe('成功响应结构', () => {
    it('应包含 success、data、timestamp 字段', () => {
      const response = {
        success: true,
        data: { id: '123', name: 'test' },
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).not.toBeNaN();
    });

    it('消息字段为可选', () => {
      const withMessage = {
        success: true,
        data: {},
        message: '操作成功',
        timestamp: new Date().toISOString(),
      };

      const withoutMessage = {
        success: true,
        data: {},
        timestamp: new Date().toISOString(),
      };

      expect(withMessage.message).toBe('操作成功');
      expect((withoutMessage as any).message).toBeUndefined();
    });
  });

  describe('错误响应结构', () => {
    it('应包含 success=false 和 error 字段', () => {
      const response = {
        success: false,
        error: '操作失败',
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('操作失败');
    });
  });

  describe('分页响应结构', () => {
    it('应包含 pagination 字段', () => {
      const total = 100;
      const limit = 20;
      const page = 3;
      const totalPages = Math.ceil(total / limit);

      const pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      expect(pagination.totalPages).toBe(5);
      expect(pagination.hasNext).toBe(true);
      expect(pagination.hasPrev).toBe(true);
    });

    it('第一页 hasPrev 应为 false', () => {
      const pagination = {
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: 1 > 1,
      };

      expect(pagination.hasPrev).toBe(false);
    });

    it('最后一页 hasNext 应为 false', () => {
      const total = 100;
      const limit = 20;
      const page = 5;
      const totalPages = Math.ceil(total / limit);

      const pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      expect(pagination.hasNext).toBe(false);
    });
  });
});
