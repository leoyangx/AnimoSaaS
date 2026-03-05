import prisma from './prisma';
import { Asset, User, InvitationCode, SiteConfig } from './types';
import { generateId } from './utils';

// Mock data for preview when DB is not connected (Empty for production)
const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    title: '示例素材',
    description: '这是一个示例素材',
    thumbnail: 'https://picsum.photos/400/600',
    category: 'character',
    tags: ['示例'],
    downloadUrl: '/example.zip',
    isDirectDownload: false,
    storageProvider: 'Local',
    downloadCount: 0,
    createdAt: new Date()
  }
];

const MOCK_CONFIG: SiteConfig = {
  title: 'AnimoSaaS',
  slogan: '为创作者而生，构建您的私域素材资产',
  logo: '',
  footer: '© 2024 AnimoSaaS. All Rights Reserved.',
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
};

const isDbConnected = !!process.env.DATABASE_URL;

export const db = {
  assets: {
    getAll: async () => {
      if (!isDbConnected) return MOCK_ASSETS;
      try {
        return await prisma.asset.findMany({ 
          orderBy: { createdAt: 'desc' },
          include: { assetCategory: true }
        });
      } catch (e) {
        return MOCK_ASSETS;
      }
    },
    getById: async (id: string) => {
      if (!isDbConnected) return MOCK_ASSETS.find(a => a.id === id) || null;
      try {
        return await prisma.asset.findUnique({ 
          where: { id },
          include: { assetCategory: true }
        });
      } catch (e) {
        return MOCK_ASSETS.find(a => a.id === id) || null;
      }
    },
    search: async (query: string) => {
      if (!isDbConnected) return MOCK_ASSETS.filter(a => a.title.includes(query));
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
        return MOCK_ASSETS.filter(a => a.title.includes(query));
      }
    },
    filter: async (categoryId?: string, tag?: string) => {
      if (!isDbConnected) {
        return MOCK_ASSETS;
      }
      try {
        return await prisma.asset.findMany({
          where: {
            categoryId: categoryId === 'all' ? undefined : categoryId,
            tags: tag === 'all' ? undefined : { has: tag },
          },
          include: { assetCategory: true }
        });
      } catch (e) {
        return MOCK_ASSETS;
      }
    },
    incrementDownload: async (id: string, userId?: string) => {
      if (!isDbConnected) return;
      try {
        await prisma.asset.update({
          where: { id },
          data: { downloadCount: { increment: 1 } },
        });
        await prisma.downloadLog.create({
          data: { assetId: id, userId }
        });
      } catch (e) {}
    },
    getDownloadLogs: async (days: number = 7) => {
      if (!isDbConnected) return [];
      const date = new Date();
      date.setDate(date.getDate() - days);
      try {
        return await prisma.downloadLog.findMany({
          where: { createdAt: { gte: date } },
          orderBy: { createdAt: 'asc' }
        });
      } catch (e) {
        return [];
      }
    },
    create: async (data: any) => {
      if (!isDbConnected) return null;
      return await prisma.asset.create({ data });
    },
    update: async (id: string, data: any) => {
      if (!isDbConnected) return null;
      return await prisma.asset.update({ where: { id }, data });
    },
    delete: async (id: string) => {
      if (!isDbConnected) return;
      await prisma.asset.delete({ where: { id } });
    }
  },
  categories: {
    getAll: async () => {
      if (!isDbConnected) return [];
      try {
        return await prisma.assetCategory.findMany({
          orderBy: { order: 'asc' },
          include: { children: true }
        });
      } catch (e) {
        return [];
      }
    },
    getHierarchical: async () => {
      if (!isDbConnected) return [];
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
        return [];
      }
    },
    create: async (data: any) => {
      if (!isDbConnected) return null;
      return await prisma.assetCategory.create({ data });
    },
    update: async (id: string, data: any) => {
      if (!isDbConnected) return null;
      return await prisma.assetCategory.update({ where: { id }, data });
    },
    delete: async (id: string) => {
      if (!isDbConnected) return;
      await prisma.assetCategory.delete({ where: { id } });
    }
  },
  navigation: {
    getAll: async () => {
      if (!isDbConnected) return [];
      try {
        return await prisma.topNav.findMany({
          orderBy: { order: 'asc' }
        });
      } catch (e) {
        return [];
      }
    },
    create: async (data: any) => {
      if (!isDbConnected) return null;
      return await prisma.topNav.create({ data });
    },
    update: async (id: string, data: any) => {
      if (!isDbConnected) return null;
      return await prisma.topNav.update({ where: { id }, data });
    },
    delete: async (id: string) => {
      if (!isDbConnected) return;
      await prisma.topNav.delete({ where: { id } });
    }
  },
  users: {
    getAll: async () => {
      if (!isDbConnected) return [];
      try {
        return await prisma.user.findMany({
          orderBy: { createdAt: 'desc' }
        });
      } catch (e) {
        return [];
      }
    },
    getByEmail: async (email: string) => {
      if (!isDbConnected) return null;
      try {
        return await prisma.user.findUnique({ where: { email } });
      } catch (e) {
        return null;
      }
    },
    create: async (data: any) => {
      if (!isDbConnected) return null;
      return await prisma.user.create({ data });
    },
    update: async (id: string, data: any) => {
      if (!isDbConnected) return;
      await prisma.user.update({ where: { id }, data });
    },
    delete: async (id: string) => {
      if (!isDbConnected) return;
      await prisma.user.delete({ where: { id } });
    }
  },
  codes: {
    getAll: async () => {
      if (!isDbConnected) return [];
      try {
        return await prisma.invitationCode.findMany({ orderBy: { createdAt: 'desc' } });
      } catch (e) {
        return [];
      }
    },
    getByCode: async (code: string) => {
      if (!isDbConnected) return null;
      try {
        return await prisma.invitationCode.findUnique({ where: { code } });
      } catch (e) {
        return null;
      }
    },
    use: async (code: string, userId: string) => {
      if (!isDbConnected) return;
      await prisma.invitationCode.update({
        where: { code },
        data: { status: 'used', usedBy: userId },
      });
    },
    generate: async (count: number) => {
      if (!isDbConnected) return;
      const newCodes = Array.from({ length: count }).map(() => ({
        code: `ANIMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'unused',
      }));
      await prisma.invitationCode.createMany({ data: newCodes });
    },
    delete: async (code: string) => {
      if (!isDbConnected) return;
      await prisma.invitationCode.delete({ where: { code } });
    }
  },
  config: {
    get: async () => {
      if (!isDbConnected) return MOCK_CONFIG;
      try {
        let config = await prisma.siteConfig.findFirst();
        if (!config) {
          config = await prisma.siteConfig.create({ data: {} });
        }
        return config;
      } catch (e) {
        return MOCK_CONFIG;
      }
    },
    update: async (data: any) => {
      if (!isDbConnected) return;
      const config = await prisma.siteConfig.findFirst();
      if (config) {
        const { id, ...updateData } = data;
        await prisma.siteConfig.update({
          where: { id: config.id },
          data: updateData,
        });
      }
    }
  },
  logs: {
    getAll: async (limit: number = 50) => {
      if (!isDbConnected) return [];
      try {
        return await prisma.adminLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit
        });
      } catch (e) {
        return [];
      }
    },
    create: async (action: string, adminEmail: string, details?: string) => {
      if (!isDbConnected) return;
      try {
        await prisma.adminLog.create({
          data: { action, adminEmail, details }
        });
      } catch (e) {}
    }
  }
};
