import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { SiteConfig } from './types';
import { configCache, categoryCache } from './cache';
import crypto from 'crypto';
import type {
  AssetInput,
  AssetUpdateInput,
  CategoryInput,
  CategoryUpdateInput,
  NavigationItemInput,
  NavigationUpdateInput,
  SiteConfigUpdateInput,
} from './validators';

export const db = {
  assets: {
    getAll: async (tenantId: string) => {
      try {
        return await prisma.asset.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
          include: { assetCategory: true },
        });
      } catch (e) {
        console.error('获取素材失败:', e);
        return [];
      }
    },
    getPaginated: async (
      tenantId: string,
      options: {
        page?: number;
        limit?: number;
        categoryId?: string;
        search?: string;
        sort?: string;
        status?: string;
      } = {}
    ) => {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      const where: Prisma.AssetWhereInput = { tenantId, deletedAt: null };

      // 如果指定了分类，需要包含该分类及其所有子分类的素材
      if (options.categoryId) {
        // 递归获取所有子分类 ID
        const getAllDescendantIds = async (categoryId: string): Promise<string[]> => {
          const children = await prisma.assetCategory.findMany({
            where: { parentId: categoryId, tenantId, deletedAt: null },
            select: { id: true },
          });

          const childIds = children.map(c => c.id);
          const descendantIds = await Promise.all(
            childIds.map(id => getAllDescendantIds(id))
          );

          return [categoryId, ...childIds, ...descendantIds.flat()];
        };

        const categoryIds = await getAllDescendantIds(options.categoryId);
        where.categoryId = { in: categoryIds };
      }

      if (options.search) {
        where.OR = [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ];
      }
      if (options.status) {
        where.status = options.status;
      }

      // 排序策略
      let orderBy: Prisma.AssetOrderByWithRelationInput[] = [
        { sortOrder: 'desc' },
        { createdAt: 'desc' },
      ];
      switch (options.sort) {
        case 'createdAt':
          orderBy = [{ createdAt: 'desc' }];
          break;
        case 'downloadCount':
          orderBy = [{ downloadCount: 'desc' }];
          break;
        case 'viewCount':
          orderBy = [{ viewCount: 'desc' }];
          break;
      }

      try {
        const [data, total] = await Promise.all([
          prisma.asset.findMany({
            where,
            orderBy,
            include: { assetCategory: true },
            skip,
            take: limit,
          }),
          prisma.asset.count({ where }),
        ]);

        return {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        };
      } catch (e) {
        console.error('分页获取素材失败:', e);
        return {
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        };
      }
    },
    getById: async (id: string, tenantId?: string) => {
      try {
        return await prisma.asset.findFirst({
          where: { id, ...(tenantId ? { tenantId } : {}) },
          include: { assetCategory: true },
        });
      } catch (e) {
        console.error('获取单条素材失败:', e);
        return null;
      }
    },
    search: async (query: string, tenantId: string) => {
      try {
        return await prisma.asset.findMany({
          where: {
            tenantId,
            deletedAt: null,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          include: { assetCategory: true },
        });
      } catch (e) {
        console.error('搜索素材失败:', e);
        return [];
      }
    },
    filter: async (tenantId: string, categoryId?: string, tag?: string) => {
      try {
        return await prisma.asset.findMany({
          where: {
            tenantId,
            deletedAt: null,
            categoryId: categoryId === 'all' || !categoryId ? undefined : categoryId,
            tags: tag === 'all' || !tag ? undefined : { has: tag },
          },
          include: { assetCategory: true },
        });
      } catch (e) {
        console.error('筛选素材失败:', e);
        return [];
      }
    },
    incrementDownload: async (id: string, tenantId: string, userId?: string) => {
      try {
        await prisma.asset.update({
          where: { id },
          data: { downloadCount: { increment: 1 } },
        });
        await prisma.downloadLog.create({
          data: {
            assetId: id,
            userId: userId || null,
            tenantId,
          },
        });
      } catch (e) {
        console.error('记录下载失败:', e);
      }
    },
    getDownloadLogs: async (tenantId: string, days: number = 7) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      try {
        return await prisma.downloadLog.findMany({
          where: { tenantId, createdAt: { gte: date } },
          orderBy: { createdAt: 'asc' },
          include: { asset: true },
        });
      } catch (e) {
        console.error('获取下载日志失败:', e);
        return [];
      }
    },
    create: async (tenantId: string, data: AssetInput) => {
      return await prisma.asset.create({ data: { ...data, tenantId } });
    },
    update: async (id: string, tenantId: string, data: AssetUpdateInput) => {
      const asset = await prisma.asset.findFirst({ where: { id, tenantId } });
      if (!asset) throw new Error('资产不存在或无权操作');
      return await prisma.asset.update({ where: { id }, data });
    },
    delete: async (id: string, tenantId: string) => {
      const asset = await prisma.asset.findFirst({ where: { id, tenantId } });
      if (!asset) throw new Error('资产不存在或无权操作');
      await prisma.asset.update({ where: { id }, data: { deletedAt: new Date() } });
    },
    /** 递增查看次数（租户隔离） */
    incrementView: async (id: string, tenantId: string) => {
      try {
        await prisma.asset.updateMany({
          where: { id, tenantId, deletedAt: null },
          data: { viewCount: { increment: 1 } },
        });
      } catch (e) {
        console.error('记录查看失败:', e);
      }
    },
    /** 上移/下移排序（同租户内交换 sortOrder） */
    move: async (id: string, tenantId: string, direction: 'up' | 'down') => {
      const current = await prisma.asset.findFirst({ where: { id, tenantId, deletedAt: null } });
      if (!current) throw new Error('素材不存在或无权操作');

      const neighbor = await prisma.asset.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          sortOrder: direction === 'up'
            ? { gt: current.sortOrder }
            : { lt: current.sortOrder },
        },
        orderBy: { sortOrder: direction === 'up' ? 'asc' : 'desc' },
      });

      if (!neighbor) return current;

      await prisma.$transaction([
        prisma.asset.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
        prisma.asset.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
      ]);

      return current;
    },
    /** 批量删除（软删除，租户隔离） */
    batchDelete: async (tenantId: string, ids?: string[]) => {
      const where: Prisma.AssetWhereInput = { tenantId, deletedAt: null };
      if (ids && ids.length > 0) {
        where.id = { in: ids };
      }
      const result = await prisma.asset.updateMany({
        where,
        data: { deletedAt: new Date() },
      });
      return result.count;
    },
  },
  categories: {
    getAll: async (tenantId: string) => {
      try {
        return await prisma.assetCategory.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: { order: 'asc' },
          include: { children: true },
        });
      } catch (e) {
        console.error('获取分类失败:', e);
        return [];
      }
    },
    getActive: async (tenantId: string) => {
      try {
        return await prisma.assetCategory.findMany({
          where: { tenantId, deletedAt: null, status: 'active' },
          orderBy: { order: 'asc' },
          include: { children: true },
        });
      } catch (e) {
        console.error('获取活动分类失败:', e);
        return [];
      }
    },
    getHierarchical: async (tenantId: string) => {
      return categoryCache.getOrSet(`categories:tree:${tenantId}`, async () => {
        try {
          const all = await prisma.assetCategory.findMany({
            where: { tenantId, deletedAt: null },
            orderBy: { order: 'asc' },
          });
          interface CategoryNode {
            id: string;
            name: string;
            parentId: string | null;
            order: number;
            status: string;
            icon: string | null;
            tenantId: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            children: CategoryNode[];
          }
          const buildTree = (parentId: string | null = null): CategoryNode[] => {
            return all
              .filter((c) => c.parentId === parentId)
              .map((c) => ({
                ...c,
                children: buildTree(c.id),
              }));
          };
          return buildTree(null);
        } catch (e) {
          console.error('获取层级分类失败:', e);
          return [];
        }
      });
    },
    create: async (tenantId: string, data: CategoryInput) => {
      const result = await prisma.assetCategory.create({ data: { ...data, tenantId } });
      categoryCache.deleteByPrefix(`categories:`);
      return result;
    },
    update: async (id: string, tenantId: string, data: CategoryUpdateInput) => {
      const category = await prisma.assetCategory.findFirst({ where: { id, tenantId } });
      if (!category) throw new Error('分类不存在或无权操作');
      const result = await prisma.assetCategory.update({ where: { id }, data });
      categoryCache.deleteByPrefix(`categories:`);
      return result;
    },
    delete: async (id: string, tenantId: string) => {
      const category = await prisma.assetCategory.findFirst({ where: { id, tenantId } });
      if (!category) throw new Error('分类不存在或无权操作');
      await prisma.assetCategory.update({ where: { id }, data: { deletedAt: new Date() } });
      categoryCache.deleteByPrefix(`categories:`);
    },
    /** 上移/下移排序（同级同租户内交换 order） */
    move: async (id: string, tenantId: string, direction: 'up' | 'down') => {
      const current = await prisma.assetCategory.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!current) throw new Error('分类不存在或无权操作');

      // 同级排序：匹配相同 parentId
      const neighbor = await prisma.assetCategory.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          parentId: current.parentId,
          order: direction === 'up'
            ? { lt: current.order }
            : { gt: current.order },
        },
        orderBy: { order: direction === 'up' ? 'desc' : 'asc' },
      });

      if (!neighbor) return current;

      await prisma.$transaction([
        prisma.assetCategory.update({ where: { id: current.id }, data: { order: neighbor.order } }),
        prisma.assetCategory.update({ where: { id: neighbor.id }, data: { order: current.order } }),
      ]);

      categoryCache.deleteByPrefix(`categories:`);
      return current;
    },
  },
  navigation: {
    getAll: async (tenantId: string) => {
      try {
        return await prisma.topNav.findMany({
          where: { tenantId },
          orderBy: { order: 'asc' },
        });
      } catch (e) {
        console.error('获取导航失败:', e);
        return [];
      }
    },
    create: async (tenantId: string, data: NavigationItemInput) => {
      return await prisma.topNav.create({ data: { ...data, tenantId } });
    },
    update: async (id: string, tenantId: string, data: NavigationUpdateInput) => {
      const nav = await prisma.topNav.findFirst({ where: { id, tenantId } });
      if (!nav) throw new Error('导航不存在或无权操作');
      return await prisma.topNav.update({ where: { id }, data });
    },
    delete: async (id: string, tenantId: string) => {
      const nav = await prisma.topNav.findFirst({ where: { id, tenantId } });
      if (!nav) throw new Error('导航不存在或无权操作');
      await prisma.topNav.delete({ where: { id } });
    },
    /** 上移/下移排序（同租户内交换 order） */
    move: async (id: string, tenantId: string, direction: 'up' | 'down') => {
      const current = await prisma.topNav.findFirst({ where: { id, tenantId } });
      if (!current) throw new Error('导航不存在或无权操作');

      const neighbor = await prisma.topNav.findFirst({
        where: {
          tenantId,
          order: direction === 'up'
            ? { lt: current.order }
            : { gt: current.order },
        },
        orderBy: { order: direction === 'up' ? 'desc' : 'asc' },
      });

      if (!neighbor) return current;

      await prisma.$transaction([
        prisma.topNav.update({ where: { id: current.id }, data: { order: neighbor.order } }),
        prisma.topNav.update({ where: { id: neighbor.id }, data: { order: current.order } }),
      ]);

      return current;
    },
  },
  users: {
    getAll: async (tenantId: string) => {
      try {
        return await prisma.user.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        console.error('获取用户失败:', e);
        return [];
      }
    },
    getByEmail: async (email: string, tenantId: string) => {
      try {
        return await prisma.user.findUnique({
          where: { tenantId_email: { tenantId, email } },
        });
      } catch (e) {
        console.error('获取单条用户失败:', e);
        return null;
      }
    },
    getByEmailAcrossTenants: async (email: string, role?: string) => {
      try {
        const where: Prisma.UserWhereInput = { email, deletedAt: null };
        if (role) where.role = role;
        return await prisma.user.findFirst({ where });
      } catch (e) {
        console.error('跨租户查询用户失败:', e);
        return null;
      }
    },
    create: async (tenantId: string, data: { email: string; password: string; role?: string }) => {
      return await prisma.user.create({ data: { ...data, tenantId } });
    },
    update: async (
      id: string,
      tenantId: string,
      data: { disabled?: boolean; password?: string; role?: string }
    ) => {
      const user = await prisma.user.findFirst({ where: { id, tenantId } });
      if (!user) throw new Error('用户不存在或无权操作');
      await prisma.user.update({ where: { id }, data });
    },
    updateLastLogin: async (id: string) => {
      await prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    },
    delete: async (id: string, tenantId: string) => {
      const user = await prisma.user.findFirst({ where: { id, tenantId } });
      if (!user) throw new Error('用户不存在或无权操作');
      await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    },
  },
  codes: {
    getAll: async (tenantId: string) => {
      try {
        return await prisma.invitationCode.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        console.error('获取邀请码失败:', e);
        return [];
      }
    },
    getByCode: async (code: string, tenantId: string) => {
      try {
        return await prisma.invitationCode.findUnique({
          where: { tenantId_code: { tenantId, code } },
        });
      } catch (e) {
        console.error('获取单条邀请码失败:', e);
        return null;
      }
    },
    use: async (code: string, tenantId: string, userId: string) => {
      await prisma.invitationCode.update({
        where: { tenantId_code: { tenantId, code } },
        data: { status: 'used', usedBy: userId },
      });
    },
    generate: async (tenantId: string, count: number) => {
      const newCodes = Array.from({ length: count }).map(() => ({
        code: `ANIMO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        status: 'unused',
        tenantId,
      }));
      await prisma.invitationCode.createMany({ data: newCodes });
    },
    delete: async (code: string, tenantId: string) => {
      await prisma.invitationCode.delete({
        where: { tenantId_code: { tenantId, code } },
      });
    },
  },
  config: {
    get: async (tenantId: string) => {
      return configCache.getOrSet(`config:${tenantId}`, async () => {
        try {
          let config = await prisma.siteConfig.findUnique({
            where: { tenantId },
          });
          if (!config) {
            config = await prisma.siteConfig.create({ data: { tenantId } });
          }
          return config;
        } catch (e) {
          console.error('获取系统配置失败:', e);
          return {
            title: 'AnimoSaaS',
            slogan: '为创作者而生，构建您的私域素材资产',
            logo: '',
            footer: '© 2026 AnimoSaaS. All Rights Reserved.',
            themeColor: '#00FF00',
            watermark: 'ANIMOSAAS',
            emailVerificationEnabled: false,
            alistUrl: '',
            alistToken: '',
            alistRoot: '/',
            pan123Token: '',
            pan123Root: '/',
            juheUrl: '',
            juheToken: '',
          } as unknown as SiteConfig;
        }
      });
    },
    update: async (tenantId: string, data: SiteConfigUpdateInput) => {
      const config = await prisma.siteConfig.findUnique({
        where: { tenantId },
      });
      if (config) {
        await prisma.siteConfig.update({
          where: { tenantId },
          data,
        });
      } else {
        await prisma.siteConfig.create({
          data: { ...data, tenantId },
        });
      }
      configCache.delete(`config:${tenantId}`);
    },
  },
  logs: {
    getAll: async (tenantId: string, limit: number = 50) => {
      try {
        return await prisma.adminLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      } catch (e) {
        console.error('获取日志失败:', e);
        return [];
      }
    },
    create: async (action: string, adminEmail: string, tenantId: string, details?: string) => {
      try {
        await prisma.adminLog.create({
          data: { action, adminEmail, tenantId, details },
        });
      } catch (e) {
        console.error('记录日志失败:', e);
      }
    },
  },
  banners: {
    getAll: async (tenantId: string) => {
      try {
        return await prisma.banner.findMany({
          where: { tenantId },
          orderBy: { order: 'asc' },
        });
      } catch (e) {
        console.error('获取横幅失败:', e);
        return [];
      }
    },
    getActive: async (tenantId: string) => {
      try {
        return await prisma.banner.findMany({
          where: { tenantId, enabled: true },
          orderBy: { order: 'asc' },
        });
      } catch (e) {
        console.error('获取活动横幅失败:', e);
        return [];
      }
    },
    create: async (tenantId: string, data: any) => {
      return await prisma.banner.create({ data: { ...data, tenantId } });
    },
    update: async (id: string, tenantId: string, data: any) => {
      const banner = await prisma.banner.findFirst({ where: { id, tenantId } });
      if (!banner) throw new Error('横幅不存在或无权操作');
      return await prisma.banner.update({ where: { id }, data });
    },
    delete: async (id: string, tenantId: string) => {
      const banner = await prisma.banner.findFirst({ where: { id, tenantId } });
      if (!banner) throw new Error('横幅不存在或无权操作');
      await prisma.banner.delete({ where: { id } });
    },
  },
  prisma,
};
