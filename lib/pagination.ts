export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 从 URL 搜索参数中解析分页参数
 */
export function getPaginationParams(searchParams: URLSearchParams): Required<PaginationParams> {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  return { page, limit };
}

/**
 * 计算分页的 skip 和 take 值（用于 Prisma）
 */
export function getPaginationSkipTake(params: Required<PaginationParams>): {
  skip: number;
  take: number;
} {
  const { page, limit } = params;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * 创建分页响应对象
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: Required<PaginationParams>
): PaginatedResponse<T> {
  const { page, limit } = params;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * 从 Request 对象中获取分页参数
 */
export function getPaginationFromRequest(request: Request): Required<PaginationParams> {
  const url = new URL(request.url);
  return getPaginationParams(url.searchParams);
}
