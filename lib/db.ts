import { prisma } from './prisma';
import { Asset, User, InvitationCode, SiteConfig } from './types';

export const db = {
  assets: {
    getAll: async () => {
      try {
        return await prisma.asset.findMany({
          orderBy: { createdAt: 'desc' },
          include: { assetCategory: true }
        });
      } catch (e) {
        console.error('获取素材失败:', e);
        return [];
      }
    },
    getById: async (id: string) => {
      try {
        return await prisma.asset.findUnique({
          where: { id },
          include: { assetCategory: true }
        });
      } catch (e) {
        console.error('获取单条素材失败:', e);
        return null;
      }
    },
    search: async (query: string) => {
      try {
        return await prisma.asset.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          include: { assetCategory: true }
        });
      } catch (e) {
        console.error('搜索素材失败:', e);
        return [];
      }
    },
    filter: async (categoryId?: string, tag?: string) => {
      try {
        return await prisma.asset.findMany({
          where: {
            categoryId: (categoryId === 'all' || !categoryId) ? undefined : categoryId,
            tags: (tag === 'all' || !tag) ? undefined : { has: tag },
          },
          include: { assetCategory: true }
        });
      } catch (e) {
        console.error('筛选素材失败:', e);
        return [];
      }
    },
    incrementDownload: async (id: string, userId?: string) => {
      try {
        await prisma.asset.update({
          where: { id },
          data: { downloadCount: { increment: 1 } },
        });
        await prisma.downloadLog.create({
          data: {
            assetId: id,
            userId: userId || null
          }
        });
      } catch (e) {
        console.error('记录下载失败:', e);
      }
    },
    getDownloadLogs: async (days: number = 7) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      try {
        return await prisma.downloadLog.findMany({
          where: { createdAt: { gte: date } },
          orderBy: { createdAt: 'asc' },
          include: { asset: true }
        });
      } catch (e) {
        console.error('获取下载日志失败:', e);
        return [];
      }
    },
    create: async (data: any) => {
      return await prisma.asset.create({ data });
    },
    update: async (id: string, data: any) => {
      return await prisma.asset.update({ where: { id }, data });
    },
    delete: async (id: string) => {
      await prisma.asset.delete({ where: { id } });
    }
  },
  categories: {
    getAll: async () => {
      try {
        return await prisma.assetCategory.findMany({
          orderBy: { order: 'asc' },
          include: { children: true }
        });
      } catch (e) {
        console.error('获取分类失败:', e);
        return [];
      }
    },
    getHierarchical: async () => {
      try {
        const all = await prisma.assetCategory.findMany({
          orderBy: { order: 'asc' }
        });
        const buildTree = (parentId: string | null = null): any[] => {
          return all
            .filter(c => c.parentId === parentId)
            .map(c => ({
              ...c,
              children: buildTree(c.id)
            }));
        };
        return buildTree(null);
      } catch (e) {
        console.error('获取层级分类失败:', e);
        return [];
      }
    },
    create: async (data: any) => {
      return await prisma.assetCategory.create({ data });
    },
    update: async (id: string, data: any) => {
      return await prisma.assetCategory.update({ where: { id }, data });
    },
    delete: async (id: string) => {
      await prisma.assetCategory.delete({ where: { id } });
    }
  },
  navigation: {
    getAll: async () => {
      try {
        return await prisma.topNav.findMany({
          orderBy: { order: 'asc' }
        });
      } catch (e) {
        console.error('获取导航失败:', e);
        return [];
      }
    },
    create: async (data: any) => {
      return await prisma.topNav.create({ data });
    },
    update: async (id: string, data: any) => {
      return await prisma.topNav.update({ where: { id }, data });
    },
    delete: async (id: string) => {
      await prisma.topNav.delete({ where: { id } });
    }
  },
  users: {
    getAll: async () => {
      try {
        return await prisma.user.findMany({
          orderBy: { createdAt: 'desc' }
        });
      } catch (e) {
        console.error('获取用户失败:', e);
        return [];
      }
    },
    getByEmail: async (email: string) => {
      try {
        return await prisma.user.findUnique({ where: { email } });
      } catch (e) {
        console.error('获取单条用户失败:', e);
        return null;
      }
    },
    create: async (data: any) => {
      return await prisma.user.create({ data });
    },
    update: async (id: string, data: any) => {
      await prisma.user.update({ where: { id }, data });
    },
    updateLastLogin: async (id: string) => {
      await prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() }
      });
    },
    delete: async (id: string) => {
      await prisma.user.delete({ where: { id } });
    }
  },
  codes: {
    getAll: async () => {
      try {
        return await prisma.invitationCode.findMany({ orderBy: { createdAt: 'desc' } });
      } catch (e) {
        console.error('获取邀请码失败:', e);
        return [];
      }
    },
    getByCode: async (code: string) => {
      try {
        return await prisma.invitationCode.findUnique({ where: { code } });
      } catch (e) {
        console.error('获取单条邀请码失败:', e);
        return null;
      }
    },
    use: async (code: string, userId: string) => {
      await prisma.invitationCode.update({
        where: { code },
        data: { status: 'used', usedBy: userId },
      });
    },
    generate: async (count: number) => {
      const crypto = require('crypto');
      const newCodes = Array.from({ length: count }).map(() => ({
        code: `ANIMO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        status: 'unused',
      }));
      await prisma.invitationCode.createMany({ data: newCodes });
    },
    delete: async (code: string) => {
      await prisma.invitationCode.delete({ where: { code } });
    }
  },
  config: {
    get: async () => {
      try {
        let config = await prisma.siteConfig.findFirst();
        if (!config) {
          config = await prisma.siteConfig.create({ data: {} });
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
          juheToken: ''
        } as unknown as SiteConfig;
      }
    },
    update: async (data: any) => {
      const config = await prisma.siteConfig.findFirst();
      if (config) {
        const { id, createdAt, updatedAt, ...updateData } = data;
        await prisma.siteConfig.update({
          where: { id: config.id },
          data: updateData,
        });
      } else {
        await prisma.siteConfig.create({ data });
      }
    }
  },
  logs: {
    getAll: async (limit: number = 50) => {
      try {
        return await prisma.adminLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit
        });
      } catch (e) {
        console.error('获取日志失败:', e);
        return [];
      }
    },
    create: async (action: string, adminEmail: string, details?: string) => {
      try {
        await prisma.adminLog.create({
          data: { action, adminEmail, details }
        });
      } catch (e) {
        console.error('记录日志失败:', e);
      }
    }
  }
};
