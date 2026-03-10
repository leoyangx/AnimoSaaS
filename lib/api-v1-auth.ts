/**
 * API v1 认证辅助函数
 *
 * middleware 只验证 API Key 格式并传递 x-api-key-raw header，
 * route handler 需要调用此函数完成完整验证和权限提取。
 */

import { verifyApiKey } from './api-keys';
import { errorResponse } from './api-response';

export interface ApiKeyContext {
  tenantId: string;
  apiKeyId: string;
  permissions: string[];
}

/**
 * 从请求中验证 API Key 并提取上下文
 * 返回 null 表示验证失败（已设置响应）
 */
export async function authenticateApiKey(
  req: Request
): Promise<{ context: ApiKeyContext } | { error: Response }> {
  const rawKey = req.headers.get('x-api-key-raw');

  if (!rawKey) {
    return {
      error: errorResponse('缺少 API Key', 401),
    };
  }

  const apiKey = await verifyApiKey(rawKey);

  if (!apiKey) {
    return {
      error: errorResponse('API Key 无效、已禁用或已过期', 401),
    };
  }

  return {
    context: {
      tenantId: apiKey.tenantId,
      apiKeyId: apiKey.id,
      permissions: apiKey.permissions as string[],
    },
  };
}
