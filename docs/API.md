# API 文档

AnimoSaaS 提供三层 API 体系：

| 层级           | 路径前缀           | 认证方式                        | 用途           |
| -------------- | ------------------ | ------------------------------- | -------------- |
| V1 开放 API    | `/api/v1/`         | API Key (Bearer Token)          | 外部系统集成   |
| Admin API      | `/api/admin/`      | JWT Cookie (`admin_token`)      | 租户管理后台   |
| SuperAdmin API | `/api/superadmin/` | JWT Cookie (`superadmin_token`) | 超级管理员平台 |

## 通用响应格式

所有 API 遵循统一响应结构：

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2026-03-07T12:00:00.000Z"
}
```

### 分页响应

```json
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
  "timestamp": "2026-03-07T12:00:00.000Z"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误描述",
  "timestamp": "2026-03-07T12:00:00.000Z"
}
```

### 验证错误响应

```json
{
  "success": false,
  "error": "数据验证失败",
  "errors": [{ "field": "email", "message": "邮箱格式不正确" }],
  "timestamp": "2026-03-07T12:00:00.000Z"
}
```

---

## V1 开放 API

使用 API Key 认证，适用于外部系统集成。

### 认证方式

在请求 Header 中携带 API Key：

```
Authorization: Bearer ak_xxxxxxxxxxxxxxxx...
```

中间件会自动验证 API Key 并注入以下 Header：

- `x-tenant-id` — 租户 ID
- `x-tenant-slug` — 租户标识
- `x-api-key-id` — API Key ID
- `x-api-key-permissions` — 权限列表（JSON 数组）

### 权限列表

| 权限               | 说明               |
| ------------------ | ------------------ |
| `assets:read`      | 读取资产列表和详情 |
| `assets:write`     | 创建和更新资产     |
| `assets:delete`    | 删除资产           |
| `categories:read`  | 读取分类信息       |
| `categories:write` | 创建和更新分类     |
| `users:read`       | 读取用户列表       |
| `download:read`    | 下载资产文件       |
| `logs:read`        | 读取下载日志       |
| `*`                | 所有权限（通配符） |
| `assets:*`         | 资产相关所有权限   |

### GET /api/v1/assets

获取资产列表。需要 `assets:read` 权限。

**查询参数：**

| 参数       | 类型   | 默认值 | 说明                     |
| ---------- | ------ | ------ | ------------------------ |
| `page`     | number | 1      | 页码                     |
| `limit`    | number | 20     | 每页数量（最大 100）     |
| `category` | string | -      | 分类 ID 筛选             |
| `search`   | string | -      | 搜索关键词（标题、描述） |
| `tag`      | string | -      | 标签筛选                 |

**响应：**

```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "clxxx...",
        "title": "素材标题",
        "description": "描述",
        "thumbnail": "/uploads/thumb.jpg",
        "tags": ["tag1", "tag2"],
        "downloadCount": 42,
        "fileSize": 1048576,
        "categoryId": "clyyy...",
        "createdAt": "2026-03-01T00:00:00.000Z",
        "updatedAt": "2026-03-01T00:00:00.000Z",
        "assetCategory": {
          "id": "clyyy...",
          "name": "分类名"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /api/v1/assets/:id

获取单个资产详情。需要 `assets:read` 权限。

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "title": "素材标题",
    "description": "描述",
    "thumbnail": "/uploads/thumb.jpg",
    "tags": ["tag1", "tag2"],
    "downloadCount": 42,
    "fileSize": 1048576,
    "categoryId": "clyyy...",
    "storageProvider": "local",
    "isDirectDownload": false,
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-01T00:00:00.000Z",
    "assetCategory": {
      "id": "clyyy...",
      "name": "分类名"
    }
  }
}
```

### GET /api/v1/assets/:id/download

获取资产下载链接。需要 `download:read` 权限。

自动记录下载日志并递增下载计数。

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "title": "素材标题",
    "downloadUrl": "https://example.com/file.zip",
    "storageProvider": "local",
    "isDirectDownload": true
  }
}
```

### GET /api/v1/categories

获取分类列表。需要 `categories:read` 权限。

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": "clyyy...",
      "name": "分类名",
      "parentId": null,
      "order": 0,
      "status": "active",
      "icon": "folder",
      "assetCount": 15
    }
  ]
}
```

---

## 认证 API

### POST /api/auth/login

用户/管理员登录。

**请求体：**

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**响应：** 返回用户信息，设置 HTTP-Only Cookie（`admin_token` 或 `auth_token`）。

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxx...",
      "email": "admin@example.com",
      "role": "admin"
    }
  },
  "message": "登录成功"
}
```

### POST /api/auth/register

用户注册（需要邀请码）。

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "invitationCode": "ABC12345"
}
```

**响应：** 返回用户信息，设置 `auth_token` Cookie。

### POST /api/superadmin/login

超级管理员登录（独立认证体系）。

**请求体：**

```json
{
  "email": "superadmin@example.com",
  "password": "password123"
}
```

**响应：** 返回用户信息，设置 `superadmin_token` Cookie（24 小时有效）。

### POST /api/superadmin/logout

超级管理员登出，清除 Cookie。

---

## Admin API

所有请求需要有效的 `admin_token` Cookie（JWT，管理员角色）。

### 素材管理

#### POST /api/admin/assets

创建素材。自动检查资产配额。

**请求体：** 素材表单数据（title、description、categoryId、tags、downloadUrl 等）。

#### PUT /api/admin/assets/:id

更新素材信息。

**请求体：** 要更新的字段。

#### DELETE /api/admin/assets/:id

软删除素材（移入回收站）。自动更新配额。

#### POST /api/admin/assets/:id/restore

从回收站恢复素材。

#### POST /api/admin/assets/batch

批量操作素材。

**请求体：**

```json
{
  "action": "delete | restore | updateCategory | addTags | removeTags",
  "assetIds": ["id1", "id2"],
  "categoryId": "可选，updateCategory 时必填",
  "tags": ["可选，addTags/removeTags 时必填"]
}
```

支持的操作：

| action           | 说明         |
| ---------------- | ------------ |
| `delete`         | 批量软删除   |
| `restore`        | 批量恢复     |
| `updateCategory` | 批量修改分类 |
| `addTags`        | 批量添加标签 |
| `removeTags`     | 批量移除标签 |

### 用户管理

#### POST /api/admin/users

手动创建用户。自动检查用户配额。

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### PATCH /api/admin/users/:id

更新用户（修改密码、启用/禁用）。

**请求体：**

```json
{
  "disabled": true,
  "password": "可选，新密码"
}
```

#### DELETE /api/admin/users/:id

删除用户。自动更新配额。

#### POST /api/admin/users/batch

批量操作用户。

**请求体：**

```json
{
  "action": "delete | restore | enable | disable | updateRole",
  "userIds": ["id1", "id2"],
  "role": "可选，updateRole 时必填"
}
```

### 分类管理

#### GET /api/admin/categories

获取所有分类列表。

#### POST /api/admin/categories

创建分类。

**请求体：** name、parentId、icon、order 等。

#### PUT /api/admin/categories/:id

更新分类。

#### DELETE /api/admin/categories/:id

删除分类。

### 邀请码管理

#### POST /api/admin/codes

批量生成邀请码。

**请求体：**

```json
{
  "count": 10
}
```

**响应：** 返回所有邀请码列表。

#### GET /api/admin/codes

导出邀请码（返回 text/plain 文件下载）。

#### DELETE /api/admin/codes/:code

删除指定邀请码。

### API Key 管理

#### GET /api/admin/api-keys

获取当前租户的 API Key 列表及可用权限。

**响应：**

```json
{
  "success": true,
  "data": {
    "keys": [
      {
        "id": "clxxx...",
        "name": "生产环境",
        "prefix": "ak_a1b2c3d4...",
        "permissions": ["assets:read", "download:read"],
        "isActive": true,
        "expiresAt": null,
        "lastUsedAt": "2026-03-01T00:00:00.000Z",
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "availablePermissions": [{ "key": "assets:read", "description": "读取资产列表和详情" }]
  }
}
```

#### POST /api/admin/api-keys

创建 API Key。

**请求体：**

```json
{
  "name": "生产环境 Key",
  "permissions": ["assets:read", "download:read"],
  "expiresIn": "30d"
}
```

| expiresIn | 说明     |
| --------- | -------- |
| `7d`      | 7 天     |
| `30d`     | 30 天    |
| `90d`     | 90 天    |
| `365d`    | 365 天   |
| `never`   | 永不过期 |

**响应：** 包含完整密钥（仅此一次可见）。

#### GET /api/admin/api-keys/:id

获取 API Key 详情。

#### PATCH /api/admin/api-keys/:id

更新 API Key。

**请求体：**

```json
{
  "name": "可选，新名称",
  "permissions": ["可选，新权限列表"],
  "isActive": false,
  "expiresAt": "2026-12-31T00:00:00.000Z"
}
```

#### DELETE /api/admin/api-keys/:id

删除 API Key。

### 站点设置

#### POST /api/admin/settings

更新站点配置（标题、Slogan、Logo、水印等）。

**请求体：** 配置字段键值对。

### 导航管理

#### POST /api/admin/navigation

更新顶部导航配置（事务操作，全量替换）。

**请求体：**

```json
[
  { "title": "首页", "href": "/", "icon": "Home" },
  { "title": "素材库", "href": "/assets", "icon": "Package" }
]
```

### 回收站

#### GET /api/admin/trash

获取回收站列表（分页）。

**查询参数：**

| 参数    | 默认值   | 说明                                    |
| ------- | -------- | --------------------------------------- |
| `type`  | `assets` | 类型：`assets` / `users` / `categories` |
| `page`  | 1        | 页码                                    |
| `limit` | 20       | 每页数量                                |

#### DELETE /api/admin/trash

清空回收站（永久删除）。

**查询参数：** `type` — 同上。

### 数据导出

#### GET /api/admin/export

导出数据（xlsx/csv）。

**查询参数：**

| 参数     | 说明                                                |
| -------- | --------------------------------------------------- |
| `type`   | `assets` / `users` / `logs` / `downloads` / `codes` |
| `format` | `xlsx`（默认）/ `csv`                               |

---

## SuperAdmin API

所有请求需要有效的 `superadmin_token` Cookie。

### 租户管理

#### GET /api/superadmin/tenants

获取所有租户列表（含配额和统计信息）。

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "name": "租户名",
      "slug": "tenant-slug",
      "plan": "free",
      "status": "active",
      "domain": null,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "userCount": 5,
      "assetCount": 120,
      "quota": {
        "maxUsers": 10,
        "maxAssets": 100,
        "maxStorage": 1073741824,
        "usedUsers": 5,
        "usedAssets": 120,
        "usedStorage": 536870912
      }
    }
  ]
}
```

#### POST /api/superadmin/tenants

创建新租户（自动创建配额和站点配置）。

**请求体：**

```json
{
  "name": "新租户",
  "slug": "new-tenant",
  "plan": "free",
  "domain": "custom.example.com",
  "maxUsers": 10,
  "maxAssets": 100,
  "maxStorage": 1073741824
}
```

- `slug` 只允许小写字母、数字和连字符，必须唯一
- `domain` 可选，必须唯一
- 配额默认值：maxUsers=10, maxAssets=100, maxStorage=1GB

#### GET /api/superadmin/tenants/:id

获取租户详情（含配额、管理员列表、最近操作日志、各类计数）。

#### PATCH /api/superadmin/tenants/:id

更新租户信息。

**请求体：**

```json
{
  "name": "可选",
  "plan": "可选 (free/pro/enterprise)",
  "status": "可选 (active/suspended/deleted)",
  "domain": "可选",
  "settings": "可选 (JSON)",
  "maxUsers": "可选",
  "maxAssets": "可选",
  "maxStorage": "可选",
  "recalculateQuota": true
}
```

#### DELETE /api/superadmin/tenants/:id

软删除租户（设置 status 为 deleted）。默认租户（slug=default）不可删除。

### 系统监控

#### GET /api/superadmin/monitoring

获取系统监控数据。

**响应包含：**

| 字段       | 说明                                   |
| ---------- | -------------------------------------- |
| `system`   | 系统信息（内存、CPU、运行时间）        |
| `requests` | 请求统计（状态分布、TopPaths、错误率） |
| `tenants`  | 租户统计（总数、活跃数、Top10 排行）   |
| `database` | 数据库状态（延迟、连接状态、记录数）   |

### 告警

#### GET /api/superadmin/alerts

获取当前活跃告警。

**响应：**

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "rule": "memory_usage",
        "severity": "warning",
        "message": "内存使用率超过 80%",
        "value": 85
      }
    ],
    "total": 1,
    "critical": 0,
    "warning": 1,
    "info": 0
  }
}
```

告警规则：

| 规则               | 说明           |
| ------------------ | -------------- |
| `memory_usage`     | 内存使用率告警 |
| `error_rate`       | API 错误率告警 |
| `database`         | 数据库连接告警 |
| `quota`            | 租户配额告警   |
| `suspended_tenant` | 停用租户告警   |

---

## 公共 API

### GET /api/settings

获取当前租户的站点配置（无需认证）。

**响应：**

```json
{
  "siteName": "AnimoSaaS",
  "slogan": "Private Domain Material Distribution System",
  "logo": "",
  "watermark": "ANIMO"
}
```

### GET /api/download/:id

前台资产下载（需要用户登录 Cookie）。

### GET /api/assets/:id/thumbnail

获取资产缩略图。

---

## 健康检查

### GET /api/health

基本健康检查。

**响应（200 正常 / 503 异常）：**

```json
{
  "status": "healthy",
  "timestamp": "2026-03-07T12:00:00.000Z",
  "database": "connected",
  "uptime": 86400,
  "version": "3.0.0",
  "node": "v20.11.0",
  "memory": {
    "rss": 128,
    "heapUsed": 64,
    "heapTotal": 96,
    "unit": "MB"
  },
  "tenants": 3,
  "users": 25
}
```

### GET /api/health/ready

就绪检查。验证数据库连接、默认租户、超级管理员和迁移状态。

**响应（200 就绪 / 503 未就绪）：**

```json
{
  "ready": true,
  "timestamp": "2026-03-07T12:00:00.000Z",
  "checks": {
    "database": { "ok": true, "message": "connected" },
    "defaultTenant": { "ok": true, "message": "id: clxxx..." },
    "superAdmin": { "ok": true, "message": "1 super admin(s)" },
    "migrations": { "ok": true, "message": "schema up to date" }
  }
}
```

---

## HTTP 状态码

| 状态码 | 含义                    |
| ------ | ----------------------- |
| 200    | 成功                    |
| 400    | 请求参数错误 / 验证失败 |
| 401    | 未认证 / 认证失败       |
| 403    | 权限不足 / 配额超限     |
| 404    | 资源不存在              |
| 429    | 请求过于频繁            |
| 500    | 服务器内部错误          |
| 503    | 服务不可用              |

## 速率限制

认证类接口（登录、注册）启用了速率限制，超限时返回 429 状态码和 `Retry-After` Header。
