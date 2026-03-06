import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 成功响应
 */
export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response);
}

/**
 * 错误响应
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: any
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  // 仅在开发环境返回详细错误信息
  if (details && process.env.NODE_ENV === 'development') {
    (response as any).details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Zod 验证错误响应
 */
export function validationErrorResponse(zodError: ZodError): NextResponse<ApiResponse> {
  const errors = zodError.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return NextResponse.json(
    {
      success: false,
      error: '数据验证失败',
      errors,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

/**
 * 未授权响应
 */
export function unauthorizedResponse(message: string = '未授权访问'): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

/**
 * 禁止访问响应
 */
export function forbiddenResponse(message: string = '权限不足'): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

/**
 * 未找到响应
 */
export function notFoundResponse(message: string = '资源不存在'): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}

/**
 * 速率限制响应
 */
export function rateLimitResponse(retryAfter?: number): NextResponse<ApiResponse> {
  const response = errorResponse('请求过于频繁，请稍后再试', 429);

  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * 服务器错误响应
 */
export function serverErrorResponse(
  message: string = '服务器内部错误',
  error?: Error
): NextResponse<ApiResponse> {
  console.error('Server error:', error);
  return errorResponse(message, 500, error?.message);
}

/**
 * 分页响应
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): NextResponse<PaginatedApiResponse<T[]>> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const response: PaginatedApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response);
}
