export interface Asset {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category?: string | null;
  categoryId?: string | null;
  assetCategory?: AssetCategory | null;
  tags: string[];
  downloadUrl: string;
  storageProvider: string;
  isDirectDownload?: boolean;
  createdAt: string | Date;
  downloadCount: number;
}

export interface AssetCategory {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: AssetCategory | null;
  children?: AssetCategory[];
  order: number;
  status: string;
  icon?: string | null;
}

export interface TopNav {
  id: string;
  name: string;
  targetType: 'INTERNAL' | 'EXTERNAL' | 'CATEGORY';
  targetValue: string;
  order: number;
  status: 'active' | 'hidden';
  icon?: string | null;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: string;
  createdAt: string | Date;
  lastLogin?: string | Date | null;
  disabled: boolean;
  ip?: string | null;
  city?: string | null;
}

export interface InvitationCode {
  code: string;
  status: string;
  usedBy?: string | null;
  createdAt: string | Date;
}

export interface SiteConfig {
  id?: number;
  logo: string;
  title: string;
  slogan: string;
  footer: string;
  themeColor: string;
  watermark: string;
  
  // Registration & Login
  emailVerificationEnabled: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpFrom?: string | null;

  // Storage - AList
  alistUrl?: string | null;
  alistToken?: string | null;
  alistRoot?: string | null;
  
  // Storage - 123Pan
  pan123Token?: string | null;
  pan123Root?: string | null;
  
  // Storage - Juhe
  juheUrl?: string | null;
  juheToken?: string | null;

  primaryColor?: string | null;
  secondaryColor?: string | null;
}
