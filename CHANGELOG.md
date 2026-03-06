# Changelog

All notable changes to AnimoSaaS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-06

### 🔒 Security (CRITICAL)

#### Fixed
- **[CRITICAL]** Fixed unauthenticated `/api/admin/navigation` endpoint - anyone could modify navigation without authentication
- **[CRITICAL]** Replaced hardcoded `JWT_SECRET` with environment variable validation
- **[CRITICAL]** Enhanced default admin password policy - now requires 12+ characters with uppercase, lowercase, and numbers
- **[HIGH]** Replaced insecure `Math.random()` invitation code generation with cryptographically secure `crypto.randomBytes()`
- **[HIGH]** Implemented comprehensive Zod input validation across all API endpoints
- **[HIGH]** Added CSRF protection with token validation for all state-changing operations
- **[MEDIUM]** Extended rate limiting to admin endpoints (100/min), download endpoints (10/min), and upload endpoints (5/min)
- **[MEDIUM]** Increased bcrypt salt rounds from 10 to 12 for stronger password hashing
- **[MEDIUM]** Added file upload validation with MIME type whitelist, size limits, and filename sanitization

#### Added
- Unified authentication middleware (`middleware.ts`) protecting all `/api/admin/*` and `/api/user/*` routes
- Environment variable validation system (`lib/env.ts`) with startup checks
- Comprehensive validation schemas (`lib/validators.ts`) for login, register, assets, categories, navigation, users, and settings
- CSRF token generation and verification system (`lib/csrf.ts`)
- File upload validation library (`lib/file-upload.ts`) with whitelist-based security

### 🚀 Features

#### Added
- **Batch Operations**: Bulk delete, restore, enable/disable, and update operations for assets and users
- **Data Export**: Export assets, users, logs, downloads, and invitation codes to CSV/Excel formats
- **Recycle Bin**: Soft delete support with restore functionality for assets, users, and categories
- **Image Processing**: Automatic image compression, thumbnail generation, and WebP conversion using Sharp
- **Advanced Pagination**: Unified pagination system with configurable page size (default 20, max 100)
- **Error Boundaries**: React error boundary component for graceful error handling
- **Skeleton Loading**: Loading skeleton components for improved perceived performance

#### API Endpoints
- `POST /api/admin/assets/batch` - Batch asset operations
- `POST /api/admin/users/batch` - Batch user operations
- `GET /api/admin/export` - Data export with format selection
- `GET /api/admin/trash` - Recycle bin management
- `POST /api/admin/assets/[id]/restore` - Restore deleted assets
- `POST /api/admin/users/[id]/restore` - Restore deleted users

### 🏗️ Architecture

#### Changed
- Standardized all API responses with unified format (`lib/api-response.ts`)
- Enhanced rate limiting with multi-tier strategy for different endpoint types
- Improved database query performance with 9 new indexes on frequently queried fields
- Removed all `as any` type assertions and implemented comprehensive TypeScript types

#### Added
- Database indexes on: `User.role`, `User.disabled`, `User.createdAt`, `Asset.categoryId`, `Asset.createdAt`, `Asset.downloadCount`, `Asset.title`, `DownloadLog.assetId`, `DownloadLog.createdAt`
- Soft delete support with `deletedAt` fields on User, Asset, and AssetCategory models
- Pagination utility functions (`lib/pagination.ts`)
- Image processing utilities (`lib/image-processor.ts`)
- Data export utilities (`lib/export.ts`)

### 🛠️ Developer Experience

#### Added
- **ESLint Configuration**: Comprehensive linting rules with TypeScript support
- **Prettier Integration**: Automatic code formatting with consistent style
- **Git Hooks**: Pre-commit hooks with Husky and lint-staged for automated quality checks
- **NPM Scripts**: `lint:fix`, `format`, `format:check`, `type-check`
- **Documentation**:
  - `CONTRIBUTING.md` - Contribution guidelines with commit conventions
  - `SECURITY.md` - Security policy and vulnerability reporting process
  - `docs/DEVELOPMENT.md` - Comprehensive development guide
  - `docs/API.md` - Complete API documentation
  - `MIGRATION_GUIDE.md` - Database migration instructions
  - `QUICK_START.md` - Quick start guide for new developers

#### Changed
- Updated `.eslintrc.json` with strict TypeScript rules and React hooks validation
- Enhanced `package.json` with lint-staged configuration
- Improved `.gitignore` to ensure `.env` files are never committed

### 📦 Dependencies

#### Added
- `zod@^4.3.6` - Runtime type validation
- `sharp@^0.34.5` - Image processing
- `xlsx@^0.18.5` - Excel export functionality
- `eslint-config-prettier@^10.1.8` - ESLint and Prettier integration
- `prettier@^3.8.1` - Code formatting
- `husky@^9.1.7` - Git hooks
- `lint-staged@^16.3.2` - Pre-commit linting

### 🗃️ Database

#### Changed
- Added 9 performance indexes for optimized queries
- Added soft delete support with `deletedAt` fields
- Migration files created: `add_indexes`, `add_soft_delete`

### 📝 Documentation

#### Added
- Complete API documentation with request/response examples
- Security policy with vulnerability reporting guidelines
- Contribution guide with commit conventions and PR workflow
- Development guide with setup instructions and best practices
- Migration guide with manual SQL scripts and troubleshooting
- Quick start guide for rapid onboarding

### ⚠️ Breaking Changes

- **Environment Variables**: `JWT_SECRET` is now required and must be at least 32 characters
- **Admin Password**: Default admin password now requires 12+ characters with complexity requirements
- **API Responses**: All API endpoints now return standardized response format with `success`, `data`, `message`, and `timestamp` fields
- **Authentication**: All `/api/admin/*` routes now require valid admin authentication via middleware

### 🔄 Migration Notes

For users upgrading from v1.x to v2.0.0:

1. **Update Environment Variables**:
   ```bash
   # Add to .env
   JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
   ADMIN_PASSWORD="SecurePassword123"  # Must be 12+ chars with uppercase, lowercase, and numbers
   ```

2. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   # Or use manual SQL scripts in MIGRATION_GUIDE.md
   ```

3. **Update Admin Password**: If your existing admin password doesn't meet the new requirements, reset it via the init endpoint or database.

4. **Review API Clients**: Update any API clients to handle the new standardized response format.

5. **Check Rate Limits**: Ensure your applications respect the new rate limiting policies.

### 📊 Statistics

- **Files Created**: 25+
- **Files Modified**: 10+
- **Security Fixes**: 9 (3 CRITICAL, 3 HIGH, 3 MEDIUM)
- **New Dependencies**: 7
- **Database Indexes Added**: 9
- **New API Endpoints**: 6
- **Lines of Code Added**: 2000+

---

## [1.0.0] - 2026-03-05

### Added
- Initial release of AnimoSaaS
- Basic asset management system
- User authentication with JWT
- Invitation code system
- Admin dashboard
- Category management
- Download tracking
- Storage engine integration (AList, 123 Cloud)
- Dark theme UI with Tailwind CSS
- PostgreSQL database with Prisma ORM

### Known Issues
- Multiple security vulnerabilities (fixed in v2.0.0)
- Missing input validation (fixed in v2.0.0)
- No rate limiting on admin endpoints (fixed in v2.0.0)
- Weak default passwords (fixed in v2.0.0)

---

[2.0.0]: https://github.com/leoyangx/AnimoSaaS/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/leoyangx/AnimoSaaS/releases/tag/v1.0.0
