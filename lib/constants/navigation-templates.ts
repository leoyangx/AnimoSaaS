/**
 * 导航模板类型配置
 *
 * 这是一个通用的、可扩展的模板类型系统，适用于各种场景的开源项目
 *
 * @author AnimoSaaS Team
 * @version 2.0.0
 */

export type NavigationTemplateType =
  | 'home'
  | 'list'
  | 'detail'
  | 'category'
  | 'download'
  | 'gallery'
  | 'form'
  | 'custom'
  | 'external'
  | 'iframe';

export type NavigationTargetType = 'INTERNAL' | 'EXTERNAL' | 'CATEGORY';

export interface NavigationTemplate {
  /** 模板类型ID */
  id: NavigationTemplateType;
  /** 显示标签 */
  label: string;
  /** 图标名称（lucide-react） */
  icon: string;
  /** 描述说明 */
  description: string;
  /** 样式类名 */
  className: string;
  /** 默认目标类型 */
  defaultTargetType: NavigationTargetType;
  /** 默认目标值 */
  defaultTargetValue: string;
  /** 是否需要用户输入URL */
  requiresUrl?: boolean;
  /** 是否需要选择分类 */
  requiresCategory?: boolean;
  /** 是否需要选择内部模块 */
  requiresModule?: boolean;
}

/**
 * 通用导航模板配置
 *
 * 设计原则：
 * 1. 通用性：适用于各种类型的内容管理系统
 * 2. 可扩展：租户可以自定义模板类型
 * 3. 语义化：模板名称清晰表达用途
 * 4. 灵活性：支持内部/外部/分类三种目标类型
 */
export const NAVIGATION_TEMPLATES: Record<NavigationTemplateType, NavigationTemplate> = {
  // ==================== 基础页面类型 ====================

  home: {
    id: 'home',
    label: '首页',
    icon: 'Home',
    description: '网站主页，通常是用户访问的第一个页面',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    defaultTargetType: 'INTERNAL',
    defaultTargetValue: 'HOME',
    requiresModule: true,
  },

  list: {
    id: 'list',
    label: '列表页',
    icon: 'List',
    description: '内容列表展示页面，如文章列表、产品列表',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    defaultTargetType: 'CATEGORY',
    defaultTargetValue: '',
    requiresCategory: true,
  },

  detail: {
    id: 'detail',
    label: '详情页',
    icon: 'FileText',
    description: '单项内容详情页面，如文章详情、产品详情',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    defaultTargetType: 'INTERNAL',
    defaultTargetValue: 'ASSETS',
    requiresModule: true,
  },

  category: {
    id: 'category',
    label: '分类页',
    icon: 'Folder',
    description: '分类浏览页面，按分类筛选内容',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    defaultTargetType: 'CATEGORY',
    defaultTargetValue: '',
    requiresCategory: true,
  },

  // ==================== 功能页面类型 ====================

  download: {
    id: 'download',
    label: '下载中心',
    icon: 'Download',
    description: '资源下载页面，提供文件下载功能',
    className: 'bg-green-500/10 text-green-400 border-green-500/20',
    defaultTargetType: 'INTERNAL',
    defaultTargetValue: 'ASSETS',
    requiresModule: true,
  },

  gallery: {
    id: 'gallery',
    label: '画廊',
    icon: 'Image',
    description: '图片或视频展示页面，瀑布流或网格布局',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    defaultTargetType: 'CATEGORY',
    defaultTargetValue: '',
    requiresCategory: true,
  },

  form: {
    id: 'form',
    label: '表单页',
    icon: 'Edit',
    description: '数据提交表单页面，如联系我们、意见反馈',
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    defaultTargetType: 'INTERNAL',
    defaultTargetValue: 'ABOUT',
    requiresModule: true,
  },

  // ==================== 扩展类型 ====================

  custom: {
    id: 'custom',
    label: '自定义',
    icon: 'Settings',
    description: '自定义页面，可以是内部页面或外部链接',
    className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    defaultTargetType: 'EXTERNAL',
    defaultTargetValue: '',
    requiresUrl: true,
  },

  external: {
    id: 'external',
    label: '外部链接',
    icon: 'ExternalLink',
    description: '跳转到外部网站，在新标签页打开',
    className: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    defaultTargetType: 'EXTERNAL',
    defaultTargetValue: '',
    requiresUrl: true,
  },

  iframe: {
    id: 'iframe',
    label: '嵌入页',
    icon: 'Monitor',
    description: '通过iframe嵌入第三方页面',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    defaultTargetType: 'EXTERNAL',
    defaultTargetValue: '',
    requiresUrl: true,
  },
};

/**
 * 旧版模板类型映射（向后兼容）
 *
 * 用于数据迁移和兼容旧版本
 */
export const LEGACY_TEMPLATE_MAPPING: Record<string, NavigationTemplateType> = {
  teaching: 'list',      // 教学 → 列表页
  authorize: 'download', // 授权 → 下载中心
  ad: 'external',        // 广告 → 外部链接
};

/**
 * 获取模板配置
 *
 * @param templateType 模板类型
 * @returns 模板配置对象
 */
export function getNavigationTemplate(templateType: string): NavigationTemplate {
  // 尝试直接获取
  if (templateType in NAVIGATION_TEMPLATES) {
    return NAVIGATION_TEMPLATES[templateType as NavigationTemplateType];
  }

  // 尝试从旧版映射获取
  if (templateType in LEGACY_TEMPLATE_MAPPING) {
    const newType = LEGACY_TEMPLATE_MAPPING[templateType];
    return NAVIGATION_TEMPLATES[newType];
  }

  // 默认返回自定义类型
  return NAVIGATION_TEMPLATES.custom;
}

/**
 * 获取所有可用的模板类型（用于下拉选择）
 *
 * @returns 模板类型数组
 */
export function getAvailableTemplates(): NavigationTemplate[] {
  return Object.values(NAVIGATION_TEMPLATES);
}

/**
 * 验证模板类型是否有效
 *
 * @param templateType 模板类型
 * @returns 是否有效
 */
export function isValidTemplateType(templateType: string): boolean {
  return templateType in NAVIGATION_TEMPLATES || templateType in LEGACY_TEMPLATE_MAPPING;
}

/**
 * 内部业务模块配置
 *
 * 这些是系统内置的页面模块
 */
export const INTERNAL_MODULES = [
  { id: 'HOME', name: '首页', icon: 'Home' },
  { id: 'ASSETS', name: '素材库', icon: 'Package' },
  { id: 'SOFTWARE', name: '常用软件', icon: 'Cpu' },
  { id: 'TUTORIALS', name: '动画教学', icon: 'Play' },
  { id: 'ABOUT', name: '关于我们', icon: 'Info' },
] as const;

/**
 * 模块路由映射
 *
 * 将内部模块ID映射到实际的路由路径
 */
export const MODULE_ROUTES: Record<string, string> = {
  HOME: '/',
  ASSETS: '/?category=素材库',
  SOFTWARE: '/?category=常用软件',
  TUTORIALS: '/?category=动画教学',
  ABOUT: '/about',
};
