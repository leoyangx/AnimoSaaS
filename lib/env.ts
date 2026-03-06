import { z } from 'zod';

/**
 * 环境变量验证 schema
 */
const envSchema = z.object({
  // 数据库
  DATABASE_URL: z.string().url('DATABASE_URL 必须是有效的 URL'),

  // JWT 密钥
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET 必须至少 32 个字符')
    .describe('用于签名 JWT token 的密钥'),

  // 管理员密码
  ADMIN_PASSWORD: z
    .string()
    .min(12, 'ADMIN_PASSWORD 必须至少 12 个字符')
    .regex(/[A-Z]/, 'ADMIN_PASSWORD 必须包含大写字母')
    .regex(/[a-z]/, 'ADMIN_PASSWORD 必须包含小写字母')
    .regex(/[0-9]/, 'ADMIN_PASSWORD 必须包含数字')
    .optional()
    .describe('初始管理员密码'),

  // Node 环境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Cookie 安全设置
  DISABLE_SECURE_COOKIE: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .describe('是否禁用 secure cookie（仅开发环境）'),

  // 品牌配置（可选）
  NEXT_PUBLIC_BRAND_NAME: z.string().optional(),
  NEXT_PUBLIC_BRAND_SLOGAN: z.string().optional(),
  NEXT_PUBLIC_FOOTER_TEXT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * 验证环境变量
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 环境变量验证失败：\n');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n请检查 .env 文件配置\n');
    }
    throw new Error('环境变量验证失败');
  }
}

/**
 * 获取验证后的环境变量
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

/**
 * 检查是否为测试环境
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test';
}
