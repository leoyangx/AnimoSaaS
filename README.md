# AnimoSaaS - 开源私域动画素材管理系统

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/leoyangx/AnimoSaaS)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

AnimoSaaS 是一款专为”培训机构、个人老师、动画工作室”打造的开源私域素材分发系统。它能帮助 B 端用户快速搭建属于自己的品牌素材站，并将其作为私域流量池，为学员提供高质量的素材下载服务。

## ✨ 核心特性

- **🚀 存储引擎解耦**：内置灵活的存储引擎，目前支持直接填写 AList 接口、123 云盘或聚合网盘 Token，实现自动探测直接真实下载地址和缩略图，大幅降低您的存储和带宽成本。
- **🛡️ 私域邀请与权限控制**：内置邀请码发放逻辑，一键生成、导出邀请码，精准控制学员入驻。基于 JWT 和 HTTP Only Cookie 的安全状态管理。
- **🔒 企业级安全保障**：完整的输入验证、CSRF 保护、速率限制、文件上传验证，通过 OWASP Top 10 安全检查。
- **🎨 赛博未来极简审美**：暗黑玻璃态配合高对比的荧光辅助色，采用 Tailwind CSS v4 与 Motion 精心打磨每个交互细节，深度契合高质量动画渲染和技术展示。
- **📊 深度管理后台**：
  - **核心监控看板**：提供今日活跃、日志监控及存储使用率一览。
  - **资产动态管理**：层级化资源目录管理与打标签，精细控制资源展示形式，支持批量操作和回收站。
  - **品牌全屋定制**：系统支持在线直接配置网站信息、Logo 和主色调，甚至可以实时自定义你的底层导航菜单。
  - **异常干预与追踪**：提供细粒度的学员账号开关控制和管理员操作轨迹查询。
  - **数据导出分析**：一键导出资产、用户、日志数据为 CSV/Excel 格式。

## 🛠️ 技术栈

### 前端
- **框架**: [Next.js 15.1.7](https://nextjs.org/) (App Router)
- **UI 库**: React 19.0.0
- **语言**: TypeScript 5.7.3
- **样式**: [Tailwind CSS 4.0.8](https://tailwindcss.com/)
- **动画**: [Motion 12.4.7](https://motion.dev/) (Framer)
- **图标**: Lucide React 0.475.0
- **主题**: next-themes 0.4.4

### 后端
- **运行时**: Node.js 20+
- **数据库**: PostgreSQL 15
- **ORM**: [Prisma 6.4.1](https://www.prisma.io/)
- **认证**: JWT + bcryptjs (12 salt rounds)
- **验证**: [Zod 4.3.6](https://zod.dev/)
- **图片处理**: Sharp 0.34.5
- **数据导出**: xlsx 0.18.5

### 开发工具
- **代码规范**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **类型检查**: TypeScript strict mode

## 📚 项目部署

我们提供了极其详细的部署指南，请参考：
👉 [部署指南 (DEPLOYMENT.md)](./DEPLOYMENT.md)

推荐使用 Docker Compose 以获得开箱即用的体验，无需关心环境版本和依赖。

## 🚀 本地开发指南

如果您希望在本地进行二次开发，请遵循以下步骤：

### 1. 克隆仓库

```bash
git clone https://github.com/leoyangx/AnimoSaaS.git
cd AnimoSaaS
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量文件并启动本地数据库：

```bash
cp .env.example .env
```

修改 `.env` 中的 `DATABASE_URL`，使其指向您本地的 PostgreSQL 数据库。(或使用 `docker-compose up -d db` 仅启动开发数据库)

### 4. 数据表推送与开发服务器

```bash
npx prisma db push
npm run dev
```

成功后访问 [http://localhost:3000](http://localhost:3000)。
你可以通过创建并在 `.env` 中设置 `ADMIN_PASSWORD`，系统首次启动后会自动捕获它并初始化你的默认 admin 账号。

## 📖 文档

- [部署指南](./DEPLOYMENT.md) - Docker 和手动部署说明
- [开发指南](./docs/DEVELOPMENT.md) - 本地开发环境设置和开发工作流
- [API 文档](./docs/API.md) - 完整的 API 接口文档
- [贡献指南](./CONTRIBUTING.md) - 如何参与项目贡献
- [安全政策](./SECURITY.md) - 安全漏洞报告流程
- [更新日志](./CHANGELOG.md) - 版本更新记录
- [迁移指南](./MIGRATION_GUIDE.md) - 数据库迁移说明

## 🔒 安全性

AnimoSaaS v2.0.0 经过全面的安全审计和加固：

- ✅ 统一认证中间件保护所有管理端点
- ✅ Zod 运行时输入验证防止注入攻击
- ✅ CSRF 保护防止跨站请求伪造
- ✅ 多层速率限制防止暴力破解和 DDoS
- ✅ 文件上传白名单验证和大小限制
- ✅ 密码学安全的随机数生成
- ✅ 强密码策略（12+ 字符，大小写字母和数字）
- ✅ bcrypt 12 rounds 密码哈希
- ✅ HTTP-only cookies 防止 XSS 窃取
- ✅ 环境变量验证防止配置错误

查看完整的安全特性和最佳实践：[SECURITY.md](./SECURITY.md)

## 🚀 快速开始

### 使用 Docker Compose（推荐）

```bash
# 克隆仓库
git clone https://github.com/leoyangx/AnimoSaaS.git
cd AnimoSaaS

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 JWT_SECRET 和 ADMIN_PASSWORD

# 启动服务
docker-compose up -d

# 访问应用
# http://localhost:3000
```

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动数据库（使用 Docker）
docker-compose up -d db

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run dev

# 初始化管理员账号
# 访问 http://localhost:3000/api/init
```

详细说明请参考 [QUICK_START.md](./QUICK_START.md)

## 🤝 参与贡献

我们欢迎所有形式的贡献！

- 🐛 报告 Bug：通过 [GitHub Issues](https://github.com/leoyangx/AnimoSaaS/issues) 提交
- 💡 功能建议：通过 Issues 讨论新功能
- 🔧 提交代码：Fork 项目并提交 Pull Request
- 📖 改进文档：帮助完善文档和示例

在贡献前，请阅读 [贡献指南](./CONTRIBUTING.md) 了解开发规范和提交流程。

## 📊 项目统计

- **代码行数**: 10,000+
- **API 端点**: 20+
- **数据库表**: 8
- **组件数量**: 30+
- **测试覆盖率**: 目标 60%+

## 🗺️ 路线图

### v2.1.0（计划中）
- [ ] 单元测试和集成测试
- [ ] API 文档自动生成（Swagger）
- [ ] 国际化支持（i18n）
- [ ] Redis 缓存层

### v2.2.0（计划中）
- [ ] WebSocket 实时通知
- [ ] 高级搜索和过滤
- [ ] 数据统计和图表
- [ ] 邮件通知系统

### v3.0.0（未来）
- [ ] 多租户支持
- [ ] CDN 集成
- [ ] 全文搜索（Elasticsearch）
- [ ] 移动端适配

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 协议开源，完全免费且允许商用及二次修改。

## 🙏 致谢

感谢所有为 AnimoSaaS 做出贡献的开发者和用户！

特别感谢以下开源项目：
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod](https://zod.dev/)
- [Sharp](https://sharp.pixelplumbing.com/)

## 📞 联系方式

- **GitHub Issues**: https://github.com/leoyangx/AnimoSaaS/issues
- **安全问题**: security@example.com
- **开发团队**: dev@example.com

---

**AnimoSaaS v2.0.0** —— 为创作者而生，构建安全高效的私域资产帝国。

Made with ❤️ by the AnimoSaaS Team
