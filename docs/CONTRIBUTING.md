# 贡献指南

感谢您对 AnimoSaaS 项目的关注！我们欢迎所有形式的贡献。

## 开发环境设置

### 前置要求

- Node.js 20+
- PostgreSQL 15+
- Git

### 安装步骤

1. Fork 并克隆仓库

```bash
git clone https://github.com/your-username/animosaas.git
cd animosaas
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置必需的环境变量
```

4. 运行数据库迁移

```bash
npx prisma migrate dev
npx prisma generate
```

5. 启动开发服务器

```bash
npm run dev
```

## 开发工作流

### 分支策略

- `main` - 生产分支，始终保持稳定
- `develop` - 开发分支
- `feature/*` - 新功能分支
- `fix/*` - Bug 修复分支
- `hotfix/*` - 紧急修复分支

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（type）：**

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例：**

```
feat(auth): 添加双因素认证

实现了基于 TOTP 的双因素认证功能，提升账号安全性。

Closes #123
```

### 代码规范

项目使用 ESLint 和 Prettier 进行代码规范检查：

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

### Git Hooks

项目配置了 Husky 和 lint-staged，在提交前会自动：

- 运行 ESLint 检查并自动修复
- 运行 Prettier 格式化
- 运行类型检查

如果检查失败，提交会被阻止。

## Pull Request 流程

1. **创建分支**

```bash
git checkout -b feature/your-feature-name
```

2. **开发和提交**

```bash
git add .
git commit -m "feat: 添加新功能"
```

3. **推送到远程**

```bash
git push origin feature/your-feature-name
```

4. **创建 Pull Request**

- 在 GitHub 上创建 PR
- 填写 PR 模板
- 等待代码审查

5. **代码审查**

- 至少需要 1 个审查者批准
- 所有 CI 检查必须通过
- 解决所有审查意见

6. **合并**

- 使用 Squash and Merge
- 删除源分支

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- path/to/test

# 生成覆盖率报告
npm run test:coverage
```

### 编写测试

- 为新功能编写单元测试
- 为 API 编写集成测试
- 确保测试覆盖率 > 60%

## 文档

### 更新文档

如果您的更改影响了：

- API 接口 - 更新 API 文档
- 配置选项 - 更新配置文档
- 用户功能 - 更新用户指南

### 文档位置

- `README.md` - 项目概述
- `docs/API.md` - API 文档
- `docs/DEVELOPMENT.md` - 开发指南
- `CONTRIBUTING.md` - 本文件

## 问题报告

### Bug 报告

使用 GitHub Issues 报告 Bug，请包含：

- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（OS、Node 版本等）
- 截图或日志（如果适用）

### 功能请求

使用 GitHub Issues 提交功能请求，请包含：

- 功能描述
- 使用场景
- 预期效果
- 可选的实现方案

## 代码审查标准

审查者会检查：

- 代码质量和可读性
- 是否遵循项目规范
- 是否有充分的测试
- 是否有必要的文档
- 是否有安全问题
- 性能影响

## 安全问题

如果发现安全漏洞，请：

1. **不要**公开提交 Issue
2. 发送邮件到 security@example.com
3. 提供详细的漏洞信息
4. 等待我们的响应

## 许可证

通过贡献代码，您同意您的贡献将在 MIT 许可证下发布。

## 联系方式

- GitHub Issues: https://github.com/your-org/animosaas/issues
- 邮件: dev@example.com

感谢您的贡献！🎉
