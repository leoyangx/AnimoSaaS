import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant-context';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * POST /api/admin/test-storage
 * 测试存储引擎连接
 */
export async function POST(req: Request) {
  try {
    const session = await getSession('admin');
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('未授权访问', 401);
    }

    const tenantId = getTenantIdFromRequest(req);
    const body = await req.json();
    const { provider, config } = body;

    console.log('Test storage request:', { provider, config });

    if (!provider) {
      return errorResponse('缺少存储提供商参数', 400);
    }

    if (!config || typeof config !== 'object') {
      return errorResponse('缺少配置参数', 400);
    }

    // 根据不同的存储提供商进行测试
    switch (provider) {
      case 'alist':
        if (!config.alistUrl || !config.alistToken) {
          return errorResponse(`AList 配置不完整：缺少 ${!config.alistUrl ? 'AList 地址' : 'API Token'}`, 400);
        }
        // 测试 AList 连接
        try {
          const testUrl = `${config.alistUrl}/api/auth/me`;
          const response = await fetch(testUrl, {
            headers: {
              Authorization: config.alistToken,
            },
          });
          if (!response.ok) {
            return errorResponse('AList 连接失败：认证失败', 500);
          }
          return successResponse(null, 'AList 连接成功');
        } catch (error) {
          return errorResponse('AList 连接失败：无法访问服务器', 500);
        }

      case '123pan':
        if (!config.pan123ClientId || !config.pan123ClientSecret) {
          return errorResponse('123云盘配置不完整', 400);
        }
        // 123云盘暂时返回成功（需要实际API测试）
        return successResponse(null, '123云盘配置已保存（连接测试功能开发中）');

      case 'aggregate':
        if (!config.aggregateApiUrl || !config.aggregateApiKey) {
          return errorResponse('聚合网盘配置不完整', 400);
        }
        // 聚合网盘暂时返回成功（需要实际API测试）
        return successResponse(null, '聚合网盘配置已保存（连接测试功能开发中）');

      default:
        return errorResponse('不支持的存储提供商', 400);
    }
  } catch (error) {
    console.error('Test storage error:', error);
    return errorResponse('测试存储连接失败', 500, error);
  }
}
