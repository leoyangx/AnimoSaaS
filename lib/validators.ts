import { z } from 'zod';

// ==================== 认证验证器 ====================

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确').min(1, '邮箱不能为空'),
  password: z.string().min(8, '密码至少8位').max(100, '密码过长'),
});

export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z
    .string()
    .min(8, '密码至少8位')
    .max(100, '密码过长')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  invitationCode: z.string().min(1, '邀请码不能为空').optional(),
  verificationCode: z.string().optional(),
});

// ==================== 资产验证器 ====================

export const assetSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题过长'),
  description: z.string().max(2000, '描述过长').optional().nullable(),
  thumbnail: z.string().optional().nullable().refine(
    (val) => !val || val === '' || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/uploads/'),
    { message: '缩略图URL格式无效' }
  ),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).max(20, '标签数量不能超过20个').default([]),
  downloadUrl: z.string().min(1, '下载链接不能为空'),
  isDirectDownload: z.boolean().default(false),
  storageProvider: z.string().default('AList'),
  downloadPermission: z.enum(['all', 'member_only', 'specific_level']).default('all'),
  permissionLevel: z.string().max(50).optional().nullable(),
  copyrightType: z.enum(['none', 'original', 'commercial', 'cc']).default('none'),
  copyrightLabel: z.string().max(100, '版权标签过长').optional().nullable(),
  showCreatedTime: z.boolean().default(true),
  sortOrder: z.number().int().min(-9999).max(9999).default(0),
  downloadMethod: z.enum(['direct', 'proxy', 'cloud']).default('direct'),
  status: z.enum(['active', 'disabled']).default('active'),
});

export const assetUpdateSchema = assetSchema.partial();

// ==================== 分类验证器 ====================

export const categorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(100, '分类名称过长'),
  parentId: z.string().optional().nullable(),
  navigationId: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
  status: z.enum(['active', 'disabled']).default('active'),
  icon: z.string().max(50).optional().nullable(),
});

export const categoryUpdateSchema = categorySchema.partial();

// ==================== 导航验证器 ====================

// 基础 schema（不包含 refinement）
const navigationItemBaseSchema = z.object({
  name: z.string().min(1, '导航名称不能为空').max(50, '导航名称过长'),
  targetType: z.enum(['INTERNAL', 'EXTERNAL', 'CATEGORY']),
  templateType: z.enum([
    // 新版通用模板类型
    'home', 'list', 'detail', 'category', 'download', 'gallery', 'form', 'custom', 'external', 'iframe',
    // 旧版兼容（将在后续版本中移除）
    'teaching', 'authorize', 'ad'
  ]).default('custom'),
  targetValue: z.string(),
  order: z.number().int().min(0).default(0),
  status: z.enum(['active', 'disabled']).default('active'),
  icon: z.string().max(50).optional().nullable(),
  description: z.string().max(200, '描述过长').optional().nullable(),
});

// 完整 schema（包含 refinement）
export const navigationItemSchema = navigationItemBaseSchema.refine(
  (data) => {
    // 如果是外部链接类型，允许 targetValue 为空（用户可能还没填写）
    if (data.targetType === 'EXTERNAL') {
      return true;
    }
    // 其他类型必须有 targetValue
    return data.targetValue && data.targetValue.length > 0;
  },
  {
    message: '请填写目标内容',
    path: ['targetValue'],
  }
);

export const navigationUpdateSchema = navigationItemBaseSchema.partial();

export const navigationArraySchema = z.array(navigationItemSchema);

// ==================== 用户验证器 ====================

export const userCreateSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z
    .string()
    .min(8, '密码至少8位')
    .max(100, '密码过长')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  role: z.enum(['USER', 'ADMIN', 'STUDENT']).default('STUDENT'),
});

export const userUpdateSchema = z.object({
  email: z.string().email('邮箱格式不正确').optional(),
  password: z
    .string()
    .min(8, '密码至少8位')
    .max(100, '密码过长')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字')
    .optional(),
  role: z.enum(['USER', 'ADMIN', 'STUDENT']).optional(),
  disabled: z.boolean().optional(),
});

// ==================== 文件上传验证器 ====================

export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string().refine((mime) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ];
    return allowedTypes.includes(mime);
  }, '不支持的文件类型'),
  size: z.number().max(500 * 1024 * 1024, '文件大小不能超过500MB'),
});

// ==================== 系统设置验证器 ====================

export const siteConfigSchema = z.object({
  logo: z.string().max(500).default(''),
  title: z.string().min(1, '站点标题不能为空').max(100, '站点标题过长'),
  slogan: z.string().max(200, 'Slogan过长'),
  footer: z.string().max(500, '页脚文本过长'),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式不正确（应为 #RRGGBB）'),
  watermark: z.string().max(50, '水印文本过长'),
  emailVerificationEnabled: z.boolean().default(false),
  smtpHost: z.string().optional().nullable(),
  smtpPort: z.number().int().min(1).max(65535).optional().nullable(),
  smtpUser: z.string().optional().nullable(),
  smtpPass: z.string().optional().nullable(),
  smtpFrom: z.string().email('发件人邮箱格式不正确').optional().nullable(),
  alistUrl: z.string().url('AList URL格式不正确').optional().nullable(),
  alistToken: z.string().optional().nullable(),
  alistRoot: z.string().optional().nullable(),
  pan123Token: z.string().optional().nullable(),
  pan123Root: z.string().optional().nullable(),
  juheUrl: z.string().url('聚合URL格式不正确').optional().nullable(),
  juheToken: z.string().optional().nullable(),
  // 素材展示配置
  assetDisplayColumns: z.string().max(2000).optional().nullable(),
  assetDefaultSort: z.enum(['sortOrder', 'createdAt', 'downloadCount', 'viewCount']).optional().nullable(),
  assetPageSize: z.number().int().min(5).max(100).optional().nullable(),
});

export const siteConfigUpdateSchema = siteConfigSchema.partial();

// ==================== 邀请码验证器 ====================

export const invitationCodeGenerateSchema = z.object({
  count: z.number().int().min(1, '数量至少为1').max(100, '单次最多生成100个'),
});

// ==================== 租户管理验证器 ====================

export const tenantCreateSchema = z.object({
  name: z.string().min(1, '租户名称不能为空').max(100, '租户名称过长'),
  slug: z
    .string()
    .min(1, '标识符不能为空')
    .max(50, '标识符过长')
    .regex(/^[a-z0-9-]+$/, '标识符只能包含小写字母、数字和连字符'),
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).default('free'),
  domain: z.string().max(253, '域名过长').nullable().optional(),
  maxUsers: z.number().int().min(0).default(10),
  maxAssets: z.number().int().min(0).default(100),
  maxStorage: z.number().int().min(0).default(1073741824),
});

export const tenantUpdateSchema = z.object({
  name: z.string().min(1, '租户名称不能为空').max(100, '租户名称过长').optional(),
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).optional(),
  status: z.enum(['active', 'suspended', 'deleted']).optional(),
  domain: z.string().max(253, '域名过长').nullable().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  maxUsers: z.number().int().min(0).optional(),
  maxAssets: z.number().int().min(0).optional(),
  maxStorage: z.number().int().min(0).optional(),
  recalculateQuota: z.boolean().optional(),
});

// ==================== 排序操作验证器 ====================

export const moveSchema = z.object({
  direction: z.enum(['up', 'down']),
});

export type MoveInput = z.infer<typeof moveSchema>;

// ==================== 类型导出 ====================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type NavigationItemInput = z.infer<typeof navigationItemSchema>;
export type NavigationUpdateInput = z.infer<typeof navigationUpdateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type SiteConfigInput = z.infer<typeof siteConfigSchema>;
export type SiteConfigUpdateInput = z.infer<typeof siteConfigUpdateSchema>;
export type InvitationCodeGenerateInput = z.infer<typeof invitationCodeGenerateSchema>;
export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
