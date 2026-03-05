import { prisma } from './prisma';

export interface AppSettings {
  system: {
    siteName: string;
    logoUrl: string | null;
    footerText: string;
    primaryColor: string;
  };
  storage: {
    provider: string;
    config: any;
  };
  security: {
    allowRegistration: boolean;
    requireInvitation: boolean;
    adminEmail: string | null;
  };
  navigation: any[];
}

/**
 * Fetches the current application settings from the database.
 * If settings are missing, it initializes them with default values.
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    // 1. System Settings
    let system = await prisma.systemSettings.findFirst();
    if (!system) {
      system = await prisma.systemSettings.create({
        data: {
          id: 'default',
          siteName: "AnimoSaaS",
          footerText: "© 2024 AnimoSaaS. 专业动画素材管理系统",
          primaryColor: "#00ff88",
        }
      });
    }

    // 2. Storage Settings
    let storage = await prisma.storageSettings.findFirst();
    if (!storage) {
      storage = await prisma.storageSettings.create({
        data: {
          id: 'default',
          provider: "LOCAL",
          config: "{}",
        }
      });
    }

    // 3. Security Settings
    let security = await prisma.securitySettings.findFirst();
    if (!security) {
      security = await prisma.securitySettings.create({
        data: {
          id: 'default',
          allowRegistration: true,
          requireInvitation: false,
        }
      });
    }

    // 4. Navigation
    let navigation = await prisma.navigation.findMany({
      orderBy: { order: 'asc' }
    });

    if (navigation.length === 0) {
      const defaultNav = [
        { label: '素材库', type: 'MODULE', value: 'ASSETS', icon: 'Package', order: 0 },
        { label: '动画教学', type: 'MODULE', value: 'TUTORIALS', icon: 'Play', order: 1 },
        { label: '常用软件', type: 'MODULE', value: 'SOFTWARE', icon: 'Cpu', order: 2 },
        { label: '关于我们', type: 'MODULE', value: 'ABOUT', icon: 'Info', order: 3 },
      ];
      
      for (const item of defaultNav) {
        await prisma.navigation.create({ data: item as any });
      }
      navigation = await prisma.navigation.findMany({ orderBy: { order: 'asc' } });
    }

    return {
      system: {
        siteName: system.siteName,
        logoUrl: system.logoUrl,
        footerText: system.footerText,
        primaryColor: system.primaryColor,
      },
      storage: {
        provider: storage.provider,
        config: JSON.parse(storage.config),
      },
      security: {
        allowRegistration: security.allowRegistration,
        requireInvitation: security.requireInvitation,
        adminEmail: security.adminEmail,
      },
      navigation: navigation,
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Fallback to defaults to prevent crash
    return {
      system: { siteName: "AnimoSaaS", logoUrl: null, footerText: "© 2024 AnimoSaaS", primaryColor: "#00ff88" },
      storage: { provider: "LOCAL", config: {} },
      security: { allowRegistration: true, requireInvitation: false, adminEmail: null },
      navigation: []
    };
  }
}

export async function updateSystemSettings(data: Partial<AppSettings['system']>) {
  return await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data as any },
  });
}

export async function updateStorageSettings(data: Partial<AppSettings['storage']>) {
  const updateData: any = {};
  if (data.provider) updateData.provider = data.provider;
  if (data.config) updateData.config = JSON.stringify(data.config);

  return await prisma.storageSettings.upsert({
    where: { id: 'default' },
    update: updateData,
    create: { id: 'default', ...updateData },
  });
}

export async function updateSecuritySettings(data: Partial<AppSettings['security']>) {
  return await prisma.securitySettings.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data as any },
  });
}

export async function updateNavigation(items: any[]) {
  // Use a transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    await tx.navigation.deleteMany({});
    
    const createdItems = [];
    for (let i = 0; i < items.length; i++) {
      const { id, createdAt, updatedAt, ...rest } = items[i];
      const created = await tx.navigation.create({
        data: {
          ...rest,
          order: i,
        }
      });
      createdItems.push(created);
    }
    return createdItems;
  });
}
