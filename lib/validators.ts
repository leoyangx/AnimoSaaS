import { z } from 'zod';

// ==================== 认证验证器 ====================

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确').min(1, '邮箱不能为空'),
  password: z.string().min(8, '密码至少8位').max(100, '密码过长'),
});

export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string()
    .min(8, '密码至少8位')
    .max(100, '密码过长')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  invitationCode: z.string().min(1, '邀请码不能为空'),
});

// ==================== 资产验证器 ====================

export const assetSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题过长'),
  description: z.string().max(2000, '描述过长').optional().nullable(),
  thumbnail: z.string().url('缩略图URL格式不正确').optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).max(20, '标签数量不能超过20个').default([]),
  downloadUrl: z.string().url('下载链接格式不正确'),
  isDirectDownload: z.boolean().default(false),
  storageProvider: z.enum(['LOCAL', 'ALIST', 'S3', 'PAN123', 'JUHE']).default('LOCAL'),
});

export const assetUpdateSchema = assetSchema.partial();

// ==================== 分类验证器 ====================

export const categorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(100, '分类名称过长'),
  parentId: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
  status: z.enum(['active', 'hidden']).default('active'),
  icon: z.string().max(50).optional().nullable(),
});

export const categoryUpdateSchema = categorySchema.partial();

// ==================== 导航验证器 ====================

export const navigationItemSchema = z.object({
  name: z.string().min(1, '导航名称不能为空').max(50, '导航名称过长'),
  targetType: z.enum(['INTERNAL', 'EXTERNAL', 'CATEGORY']),
  targetValue: z.string().min(1, '目标值不能为空'),
  order: z.number().int().min(0).default(0),
  status: z.enum(['active', 'hidden']).default('active'),
  icon: z.string().max(50).optional().nullable(),
});

export const navigationArraySchema = z.array(navigationItemSchema);

// ==================== 用户验证器 ====================

export const userCreateSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string()
    .min(8, '密码至少8位')
    .max(100, '密码过长')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  role: z.enum(['USER', 'ADMIN', 'student']).default('student'),
});

export const userUpdateSchema = z.object({
  email: z.string().email('邮箱格式不正确').optional(),
  password: z.string()
    .min(8, '密码至少8位')
    .max(100, '密码过长')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字')
    .optional(),
  role: z.enum(['USER', 'ADMIN', 'student']).optional(),
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
});

export const siteConfigUpdateSchema = siteConfigSchema.partial();

// ==================== 邀请码验证器 ====================

export const invitationCodeGenerateSchema = z.object({
  count: z.number().int().min(1, '数量至少为1').max(100, '单次最多生成100个'),
});

// ==================== 类型导出 ====================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type NavigationItemInput = z.infer<typeof navigationItemSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type SiteConfigInput = z.infer<typeof siteConfigSchema>;
export type SiteConfigUpdateInput = z.infer<typeof siteConfigUpdateSchema>;
export type InvitationCodeGenerateInput = z.infer<typeof invitationCodeGenerateSchema>;
