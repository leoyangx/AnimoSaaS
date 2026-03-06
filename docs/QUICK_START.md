# AnimoSaaS 快速启动指南

## 🚀 升级已完成！

AnimoSaaS v2.0.0 已成功升级，包含以下改进：

- ✅ 修复 9 个安全漏洞
- ✅ 新增 12 个核心文件
- ✅ 优化数据库性能（9个索引）
- ✅ 完善类型系统和验证

---

## 📋 启动步骤

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，设置以下必需变量：
# - DATABASE_URL（数据库连接）
# - JWT_SECRET（至少32个字符）
# - ADMIN_PASSWORD（至少12位，包含大小写字母和数字）
```

**示例配置：**

```env
DATABASE_URL="postgresql://animosaas:animosaas_pass@localhost:5432/animosaas_db"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
ADMIN_PASSWORD="SecurePass123"
NODE_ENV="development"
DISABLE_SECURE_COOKIE="true"
```

### 2. 启动数据库

**使用 Docker Compose（推荐）：**

```bash
docker-compose up -d db
```

**或使用本地 PostgreSQL：**
确保 PostgreSQL 服务已启动，并创建数据库。

### 3. 运行数据库迁移

```bash
# 应用数据库迁移（添加索引和软删除字段）
npx prisma migrate dev --name add_indexes_and_soft_delete

# 生成 Prisma Client
npx prisma generate
```

### 4. 安装依赖（如果还没有）

```bash
npm install
```

### 5. 初始化管理员账号

启动开发服务器：

```bash
npm run dev
```

访问初始化端点：

```
http://localhost:3000/api/init
```

如果未设置 `ADMIN_PASSWORD`，系统会生成临时密码并在控制台显示。

### 6. 登录管理后台

访问：`http://localhost:3000/login`

使用以下凭据登录：

- 邮箱：`admin@example.com`
- 密码：你在 `.env` 中设置的 `ADMIN_PASSWORD`

---

## 🔍 验证升级

### 检查依赖安装

```bash
npm list zod sharp
```

应该看到：

- `zod@3.x.x` ✅
- `sharp@0.34.x` ✅

### 检查新文件

```bash
ls -la middleware.ts
ls -la lib/validators.ts
ls -la lib/api-response.ts
ls -la components/ErrorBoundary.tsx
```

所有文件都应该存在。

### 测试 API 端点

```bash
# 测试认证保护（应返回 401）
curl http://localhost:3000/api/admin/navigation

# 测试登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

---

## 📚 重要文档

- **升级总结**：`UPGRADE_SUMMARY.md` - 完整的升级说明
- **迁移指南**：`MIGRATION_GUIDE.md` - 数据库迁移详细步骤
- **部署指南**：`DEPLOYMENT.md` - 生产环境部署
- **升级计划**：`C:\Users\lucky\.claude\plans\zany-yawning-spindle.md`

---

## ⚠️ 重要提示

### 安全配置

1. **JWT_SECRET**：必须至少 32 个字符，使用强随机字符串
2. **ADMIN_PASSWORD**：至少 12 位，包含大小写字母和数字
3. **生产环境**：删除或设置 `DISABLE_SECURE_COOKIE=false`

### 数据库

- 升级前请备份数据库
- 迁移是安全的，不会删除现有数据
- 新增的 `deletedAt` 字段默认为 NULL

### API 变更

- 所有 `/api/admin/*` 路由现在需要管理员认证
- API 响应格式已标准化
- 速率限制已应用到所有关键端点

---

## 🐛 故障排除

### 问题：数据库连接失败

**错误**：`P1000: Authentication failed`

**解决**：

1. 检查 `DATABASE_URL` 是否正确
2. 确保数据库服务已启动
3. 验证数据库用户名和密码

### 问题：迁移失败

**错误**：`P3009: migrate found failed migrations`

**解决**：

```bash
npx prisma migrate resolve --applied add_indexes_and_soft_delete
```

### 问题：依赖安装失败

**错误**：网络连接问题

**解决**：

```bash
npm install --legacy-peer-deps
```

### 问题：管理员无法登录

**解决**：

1. 确认 `ADMIN_PASSWORD` 符合要求（12位+大小写+数字）
2. 重新访问 `/api/init` 初始化
3. 检查控制台是否有临时密码

---

## 📊 性能优化建议

### 开发环境

```bash
# 使用 Turbopack（更快的开发服务器）
npm run dev -- --turbo
```

### 生产环境

```bash
# 构建优化版本
npm run build

# 启动生产服务器
npm start
```

### 数据库优化

- ✅ 已添加 9 个索引
- ✅ 已启用软删除
- 建议：定期清理软删除的数据

---

## 🎯 下一步

### 立即可做

1. ✅ 测试所有 API 端点
2. ✅ 验证管理后台功能
3. ✅ 上传测试资产
4. ✅ 创建测试用户

### 可选升级（Phase 4-5）

- [ ] 批量操作功能
- [ ] 高级搜索和过滤
- [ ] 数据导出（CSV/Excel）
- [ ] 回收站功能
- [ ] ESLint + Prettier 配置
- [ ] 单元测试

---

## 📞 获取帮助

- 查看 `UPGRADE_SUMMARY.md` 了解详细变更
- 查看 `MIGRATION_GUIDE.md` 解决数据库问题
- 检查控制台日志获取错误信息

---

**升级版本**：v2.0.0  
**完成时间**：2026-03-06  
**状态**：Phase 1-3 已完成 ✅

祝使用愉快！🎉
