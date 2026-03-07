// ==================== 租户类型 ====================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'deleted';
  domain?: string | null;
  settings: string; // JSON
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface TenantQuota {
  id: string;
  tenantId: string;
  maxUsers: number;
  maxStorage: bigint | number;
  maxAssets: number;
  usedStorage: bigint | number;
  usedAssets: number;
  usedUsers: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface SuperAdmin {
  id: string;
  email: string;
  password?: string;
  name?: string | null;
  lastLogin?: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// ==================== API 密钥类型 ====================

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  tenantId: string;
  createdById?: string | null;
  lastUsedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// ==================== 权限类型 ====================

export interface Permission {
  id: string;
  name: string;
  scope: 'tenant' | 'global';
  description?: string | null;
}

export interface RolePermission {
  id: string;
  role: string;
  permissionId: string;
  permission?: Permission;
}

// ==================== 分页类型 ====================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedData<T> {
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

// ==================== Session 类型 ====================

export interface SessionPayload {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'student';
  tenantId?: string;
}

export interface SuperAdminSessionPayload {
  id: string;
  email: string;
  role: 'superadmin';
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  timestamp: string;
  details?: any;
}

// ==================== 资产类型 ====================

export interface Asset {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category?: string | null;
  categoryId?: string | null;
  assetCategory?: AssetCategory | null;
  tags: string[];
  downloadUrl: string;
  storageProvider: string;
  isDirectDownload?: boolean;
  downloadCount: number;
  fileSize?: bigint | number;
  tenantId?: string;
  deletedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface AssetCategory {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: AssetCategory | null;
  children?: AssetCategory[];
  order: number;
  status: string;
  icon?: string | null;
  tenantId?: string;
  deletedAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// ==================== 导航类型 ====================

export interface TopNav {
  id: string;
  name: string;
  targetType: 'INTERNAL' | 'EXTERNAL' | 'CATEGORY';
  targetValue: string;
  order: number;
  status: 'active' | 'hidden';
  icon?: string | null;
  tenantId?: string;
}

// ==================== 用户类型 ====================

export interface User {
  id: string;
  email: string;
  password?: string;
  role: string;
  disabled: boolean;
  lastLogin?: string | Date | null;
  ip?: string | null;
  city?: string | null;
  tenantId?: string;
  deletedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// ==================== 邀请码类型 ====================

export interface InvitationCode {
  id?: string;
  code: string;
  status: string;
  usedBy?: string | null;
  tenantId?: string;
  createdAt: string | Date;
}

// ==================== 下载日志类型 ====================

export interface DownloadLog {
  id: string;
  assetId: string;
  userId?: string | null;
  tenantId?: string;
  createdAt: string | Date;
}

// ==================== 管理日志类型 ====================

export interface AdminLog {
  id: string;
  action: string;
  adminEmail: string;
  details?: string | null;
  tenantId?: string;
  createdAt: string | Date;
}

// ==================== 站点配置类型 ====================

export interface SiteConfig {
  id?: number;
  logo: string;
  title: string;
  slogan: string;
  footer: string;
  themeColor: string;
  watermark: string;

  // Registration & Login
  emailVerificationEnabled: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpFrom?: string | null;

  // Storage - AList
  alistUrl?: string | null;
  alistToken?: string | null;
  alistRoot?: string | null;

  // Storage - 123Pan
  pan123Token?: string | null;
  pan123Root?: string | null;

  // Storage - Juhe
  juheUrl?: string | null;
  juheToken?: string | null;

  primaryColor?: string | null;
  secondaryColor?: string | null;

  tenantId?: string;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// ==================== 文件上传类型 ====================

export interface FileUpload {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface FileMetadata {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  hash: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

// ==================== 统计数据类型 ====================

export interface DashboardStats {
  totalUsers: number;
  totalAssets: number;
  totalDownloads: number;
  unusedCodes: number;
  recentUsers: User[];
  recentLogs: AdminLog[];
  downloadTrend: Array<{ date: string; count: number }>;
}

