# AnimoSaaS 开发指南

## 项目概述

AnimoSaaS 是一个开源的私域动画资产管理与分发系统，基于 Next.js 15 + React 19 + TypeScript + PostgreSQL 构建。

## 技术栈

### 前端
- **框架**: Next.js 15.1.7 (App Router)
- **UI 库**: React 19.0.0
- **语言**: TypeScript 5.7.3
- **样式**: Tailwind CSS 4.0.8
- **动画**: Motion (Framer) 12.4.7
- **图标**: Lucide React 0.475.0
- **主题**: next-themes 0.4.4

### 后端
- **运行时**: Node.js 20+
- **数据库**: PostgreSQL 15
- **ORM**: Prisma 6.4.1
- **认证**: JWT + bcryptjs
- **验证**: Zod 4.3.6

### 开发工具
- **代码规范**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **类型检查**: TypeScript

## 项目结构

```
animosaas/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   │   ├── admin/           # 管理端点
│   │   ├── auth/            # 认证端点
│   │   └── ...
│   ├── admin/               # 管理后台页面
│   ├── login/               # 登录页面
│   └── ...
├── components/              # React 组件
│   ├── ErrorBoundary.tsx   # 错误边界
│   ├── Skeleton.tsx        # 骨架屏
│   └── ...
├── lib/                     # 工具库
│   ├── auth.ts             # 认证工具
│   ├── db.ts               # 数据库抽象层
│   ├── validators.ts       # Zod 验证器
│   ├── api-response.ts     # API 响应标准化
│   ├── pagination.ts       # 分页工具
│   ├── file-upload.ts      # 文件上传验证
│   ├── image-processor.ts  # 图片处理
│   ├── export.ts           # 数据导出
│   └── ...
├── prisma/                  # Prisma 配置
│   └── schema.prisma       # 数据库 schema
├── middleware.ts            # Next.js 中间件
└── ...
```

## 开发环境设置

### 1. 克隆仓库

```bash
git clone https://github.com/your-org/animosaas.git
cd animosaas
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库
DATABASE_URL="postgresql://animosaas:animosaas_pass@localhost:5432/animosaas_db"

# JWT 密钥（至少 32 个字符）
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"

# 管理员密码（至少 12 位，包含大小写字母和数字）
ADMIN_PASSWORD="SecurePassword123"

# Node 环境
NODE_ENV="development"

# Cookie 安全（开发环境）
DISABLE_SECURE_COOKIE="true"
```

### 4. 启动数据库

使用 Docker Compose：

```bash
docker-compose up -d db
```

或使用本地 PostgreSQL。

### 5. 运行数据库迁移

```bash
npx prisma migrate dev
npx prisma generate
```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 7. 初始化管理员

访问 http://localhost:3000/api/init

## 开发工作流

### 代码规范

```bash
# 检查代码规范
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format

# 检查格式
npm run format:check

# 类型检查
npm run type-check
```

### Git 提交

项目配置了 Husky，提交前会自动：
- 运行 ESLint 并自动修复
- 运行 Prettier 格式化
- 检查类型

```bash
git add .
git commit -m "feat: 添加新功能"
```

### 数据库操作

```bash
# 创建迁移
npx prisma migrate dev --name migration_name

# 应用迁移
npx prisma migrate deploy

# 重置数据库（开发环境）
npx prisma migrate reset

# 打开 Prisma Studio
npx prisma studio

# 生成 Prisma Client
npx prisma generate
```

## API 开发

### 创建新的 API 端点

1. **创建路由文件**

```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { exampleSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    // 验证认证
    const session = await getSession('admin');
    if (!session) {
      return errorResponse('未授权访问', 401);
    }

    // 解析和验证请求体
    const body = await req.json();
    const validationResult = exampleSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    // 业务逻辑
    const data = validationResult.data;
    // ... 处理数据

    return successResponse(result, '操作成功');
  } catch (error) {
    console.error('Error:', error);
    return errorResponse('操作失败', 500, error);
  }
}
```

2. **添加验证 schema**

```typescript
// lib/validators.ts
export const exampleSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  value: z.number().min(0, '值必须大于0'),
});
```

3. **测试 API**

```bash
curl -X POST http://localhost:3000/api/example \
  -H "Content-Type: application/json" \
  -d '{"name":"test","value":123}'
```

### API 响应格式

所有 API 使用统一的响应格式：

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2026-03-06T12:00:00.000Z"
}

// 错误响应
{
  "success": false,
  "error": "错误消息",
  "timestamp": "2026-03-06T12:00:00.000Z"
}

// 分页响应
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-03-06T12:00:00.000Z"
}
```

## 组件开发

### 创建新组件

```typescript
// components/Example.tsx
'use client';

import { useState } from 'react';

interface ExampleProps {
  title: string;
  onAction?: () => void;
}

export function Example({ title, onAction }: ExampleProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-4 bg-zinc-900 rounded-lg">
      <h2 className="text-xl font-bold">{title}</h2>
      <button
        onClick={onAction}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-[var(--brand-primary)] text-black rounded"
      >
        {loading ? '处理中...' : '执行操作'}
      </button>
    </div>
  );
}
```

### 使用骨架屏

```typescript
import { Skeleton, AssetCardSkeleton } from '@/components/Skeleton';

function MyComponent() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <AssetCardSkeleton />;
  }

  return <div>内容</div>;
}
```

### 使用错误边界

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## 数据库开发

### 添加新模型

1. **更新 schema**

```prisma
// prisma/schema.prisma
model Example {
  id        String   @id @default(cuid())
  name      String
  value     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([name])
}
```

2. **创建迁移**

```bash
npx prisma migrate dev --name add_example_model
```

3. **更新类型定义**

```typescript
// lib/types.ts
export interface Example {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}
```

4. **添加数据库方法**

```typescript
// lib/db.ts
export const db = {
  // ... 现有方法
  example: {
    create: async (data: { name: string; value: number }) => {
      return await prisma.example.create({ data });
    },
    getAll: async () => {
      return await prisma.example.findMany();
    },
  },
};
```

## 常见任务

### 添加新的管理页面

1. 创建页面文件：`app/admin/example/page.tsx`
2. 添加到侧边栏：`app/admin/AdminSidebar.tsx`
3. 创建 API 端点：`app/api/admin/example/route.ts`

### 添加文件上传功能

```typescript
import { validateFile } from '@/lib/file-upload';
import { processImage } from '@/lib/image-processor';

// 验证文件
const validation = validateFile(filename, mimetype, size);
if (!validation.valid) {
  return errorResponse(validation.error);
}

// 处理图片
const processed = await processImage(buffer, {
  width: 800,
  quality: 80,
  format: 'webp',
});
```

### 导出数据

```typescript
import { exportToExcelBuffer } from '@/lib/export';

const buffer = exportToExcelBuffer(data, 'Sheet1', [
  { key: 'name', label: '名称' },
  { key: 'value', label: '值' },
]);

return new NextResponse(buffer, {
  headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="export.xlsx"',
  },
});
```

## 调试

### 查看日志

```bash
# 开发服务器日志
npm run dev

# 数据库查询日志
# 在 prisma/schema.prisma 中添加：
# log = ["query", "info", "warn", "error"]
```

### 使用 Prisma Studio

```bash
npx prisma studio
```

### 调试 API

使用 curl 或 Postman 测试 API：

```bash
# 测试登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

## 性能优化

### 数据库查询优化

- 使用索引
- 使用 `select` 只查询需要的字段
- 使用 `include` 而不是多次查询
- 使用分页

### 图片优化

- 使用 Sharp 压缩图片
- 生成多种尺寸
- 使用 WebP 格式
- 使用 CDN

### 缓存策略

- 使用 Next.js 缓存
- 使用 Redis（可选）
- 使用浏览器缓存

## 部署

### 生产构建

```bash
npm run build
npm start
```

### Docker 部署

```bash
docker-compose up -d
```

### 环境变量

生产环境必须设置：
- `JWT_SECRET` - 强随机字符串
- `ADMIN_PASSWORD` - 强密码
- `DISABLE_SECURE_COOKIE=false` - 启用安全 cookie
- `DATABASE_URL` - 生产数据库连接

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL`
   - 确保数据库服务已启动

2. **迁移失败**
   - 运行 `npx prisma migrate reset`（开发环境）
   - 检查 schema 语法

3. **依赖安装失败**
   - 使用 `npm install --legacy-peer-deps`
   - 清除缓存：`npm cache clean --force`

## 资源

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Zod 文档](https://zod.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 获取帮助

- GitHub Issues
- 开发者邮件列表
- 社区论坛

---

祝开发愉快！🚀
