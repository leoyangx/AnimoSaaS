# 贡献指南

感谢您对 AnimoSaaS 的关注！我们欢迎所有形式的贡献。

## 开发环境设置

```bash
git clone https://github.com/leoyangx/AnimoSaaS.git
cd AnimoSaaS
npm install
cp .env.example .env
docker-compose up -d db
npx prisma migrate dev
npm run dev
```

详细步骤见 [快速开始](QUICK_START.md)。

## 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 稳定发布分支 |
| `develop` | 开发集成分支 |
| `feature/*` | 新功能开发 |
| `fix/*` | Bug 修复 |
| `hotfix/*` | 生产热修复 |

## 提交规范

使用 Conventional Commits：

```
feat: 添加租户配额管理功能
fix: 修复 API Key 过期检查逻辑
docs: 更新部署文档
refactor: 重构缓存层
test: 添加 API Key 权限测试
chore: 升级 Prisma 版本
```

## PR 流程

1. Fork 项目并创建功能分支
2. 开发并编写测试
3. 确保所有测试通过：`npm test`
4. 确保代码规范：`npm run lint`
5. 提交 Pull Request 到 `develop` 分支
6. 等待 Code Review
7. 合并

## 代码规范

- ESLint + Prettier 自动格式化
- TypeScript strict mode
- 所有数据库查询必须包含 `tenantId` 过滤
- API 路由使用 Zod 验证输入
- 使用 `lib/api-response.ts` 统一响应格式

## 测试

提交代码前确保测试通过：

```bash
npm test                  # 单元测试（71 个用例）
npm run test:coverage     # 覆盖率报告
npm run test:e2e          # E2E 测试
```

新增功能应附带相应测试用例。

## 提交 Bug 报告

通过 [GitHub Issues](https://github.com/leoyangx/AnimoSaaS/issues) 提交，请包含：

- 问题描述
- 复现步骤
- 预期行为与实际行为
- 环境信息（OS、Node.js 版本、浏览器）

## 安全漏洞

请勿通过 Issues 公开报告安全漏洞，参考 [安全策略](SECURITY.md)。

## 开源协议

贡献的代码将遵循 [MIT License](../LICENSE)。
