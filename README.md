# AnimoSaaS - 开源私域动画素材管理系统

AnimoSaaS 是一款专为“培训机构、个人老师、动画工作室”打造的开源私域素材分发系统。它能帮助 B 端用户快速搭建属于自己的品牌素材站，并将其作为私域流量池，为学员提供高质量的素材下载服务。

![AnimoSaaS Banner](https://picsum.photos/1200/400?grayscale)

## ✨ 核心特性

- **🚀 网盘映射引擎**：无需上传文件到服务器，直接映射阿里云盘、夸克网盘资源。点击下载实时解析直链，实现“零成本”素材分发。
- **🛡️ 私域邀请制**：内置邀请码注册逻辑，一键生成/导出邀请码，精准控制学员入驻。
- **💾 数据库持久化**：采用 Prisma + PostgreSQL 方案，确保数据安全不丢失。
- **🎨 赛博未来审美**：暗黑玻璃态 + 赛博朋克极简主义设计，深度适配高质量动漫渲染素材展示。
- **📚 垂直模块定制**：预设 **AN动画教学**、**常用软件**、**场景素材**等专业动画人常用分类。
- **📊 深度管理后台**：
  - **学员管理**：实时监控学员状态，一键禁用/删除违规账号。
  - **素材映射**：管理网盘文件映射，支持多维分类与关键词搜索。
  - **存储配置**：直接在后台配置网盘 API Token，无需重启服务器。
  - **统计分析**：下载量追踪，防止资源被恶意采集。

## 🛠️ 技术栈

- **框架**: [Next.js 15 (App Router)](https://nextjs.org/)
- **数据库**: [Prisma](https://www.prisma.io/) + PostgreSQL
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **动画**: [Motion (Framer Motion)](https://motion.dev/)
- **鉴权**: JWT + bcryptjs + HTTP-only Cookies

## 🚀 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/leoyangx/AnimoSaaS.git
cd AnimoSaaS
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制 `.env.example` 为 `.env` 并填写相关配置：
```bash
cp .env.example .env
DATABASE_URL="postgresql://user:password@localhost:5432/animosaas"
```

### 4. 初始化数据库
```bash
npx prisma db push
```

### 5. 启动开发服务器
```bash
npm run dev
```
访问 [http://localhost:3000](http://localhost:3000) 即可查看。

### 6. 使用 Docker 部署 (推荐)
如果您希望快速部署，可以使用 Docker Compose：
```bash
docker-compose up -d
```
系统将自动启动 PostgreSQL 数据库和 AnimoSaaS 应用。


## 📄 开源协议

本项目采用 [MIT License](LICENSE) 协议开源。

---

**AnimoSaaS** - 为创作者而生，构建您的私域素材资产。
