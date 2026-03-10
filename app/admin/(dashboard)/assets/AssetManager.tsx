'use client';

import { useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  X,
  Loader2,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Download,
  Shield,
  Clock,
  Hash,
  Link2,
  Copyright,
  ArrowUpDown,
  Trash,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Asset } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ImageUploader';

const PERMISSION_LABELS: Record<string, { text: string; className: string }> = {
  all: { text: '所有人', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  member_only: { text: '仅会员', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  specific_level: { text: '指定等级', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

const COPYRIGHT_LABELS: Record<string, string> = {
  none: '无',
  original: '原创',
  commercial: '商用',
  cc: 'CC协议',
};

const DOWNLOAD_METHOD_LABELS: Record<string, string> = {
  direct: '浏览器直链下载',
  proxy: '服务器代理下载',
  cloud: '网盘跳转',
};

// ==================== 辅助函数 ====================

function flattenCategories(items: any[], level: number = 0): any[] {
  return items.reduce((acc, item) => {
    acc.push({ id: item.id, name: item.name, level });
    if (item.children) acc.push(...flattenCategories(item.children, level + 1));
    return acc;
  }, []);
}

// ==================== 组件 ====================

interface AssetManagerProps {
  initialAssets: Asset[];
  categories: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  initialSearch?: string;
  initialCategory?: string;
}

export default function AssetManager({
  initialAssets,
  categories,
  pagination,
  initialSearch = '',
  initialCategory = 'all',
}: AssetManagerProps) {
  const [assets, setAssets] = useState(initialAssets);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---- 初始 formData ----
  const emptyForm = {
    title: '',
    description: '',
    thumbnail: '',
    categoryId: categories[0]?.id || '',
    tags: '',
    downloadUrl: '',
    storageProvider: 'AList',
    isDirectDownload: false,
    downloadPermission: 'all',
    permissionLevel: '',
    copyrightType: 'none',
    copyrightLabel: '',
    showCreatedTime: true,
    sortOrder: 0,
    downloadMethod: 'direct',
    status: 'active',
  };

  const [formData, setFormData] = useState(emptyForm);

  // ---- 导航辅助 ----
  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(overrides)) {
        if (v === undefined || v === '' || v === 'all' || (k === 'page' && v === '1')) {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams]
  );

  const handleSearch = () => {
    router.push(buildUrl({ search: searchInput, page: '1' }));
  };

  const handleCategoryChange = (cat: string) => {
    router.push(buildUrl({ category: cat, page: '1' }));
  };

  // ---- CRUD ----
  const openModal = (asset: Asset | null = null) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        title: asset.title,
        description: asset.description || '',
        thumbnail: asset.thumbnail || '',
        categoryId: asset.categoryId || '',
        tags: asset.tags.join(', '),
        downloadUrl: asset.downloadUrl,
        storageProvider: asset.storageProvider || 'AList',
        isDirectDownload: asset.isDirectDownload || false,
        downloadPermission: asset.downloadPermission || 'all',
        permissionLevel: asset.permissionLevel || '',
        copyrightType: asset.copyrightType || 'none',
        copyrightLabel: asset.copyrightLabel || '',
        showCreatedTime: asset.showCreatedTime ?? true,
        sortOrder: asset.sortOrder ?? 0,
        downloadMethod: asset.downloadMethod || 'direct',
        status: asset.status || 'active',
      });
    } else {
      setEditingAsset(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t !== ''),
      permissionLevel: formData.downloadPermission === 'specific_level' ? formData.permissionLevel : null,
      copyrightLabel: formData.copyrightType !== 'none' ? formData.copyrightLabel : null,
    };

    try {
      const url = editingAsset ? `/api/admin/assets/${editingAsset.id}` : '/api/admin/assets';
      const method = editingAsset ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '保存失败');
      }

      toast.success(editingAsset ? '素材更新成功' : '素材创建成功');
      closeModal();
      router.refresh();
    } catch (error) {
      console.error('Failed to save asset:', error);
      toast.error(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个素材吗？')) return;
    try {
      const res = await fetch(`/api/admin/assets/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '删除失败');
      }

      toast.success('素材删除成功');
      setAssets(assets.filter((a) => a.id !== id));
      router.refresh();
    } catch (error) {
      console.error('Failed to delete asset:', error);
      toast.error(error instanceof Error ? error.message : '删除失败，请重试');
    }
  };

  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除全部 ${pagination.total} 个素材吗？此操作不可撤销！`)) return;
    try {
      const res = await fetch('/api/admin/assets/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '批量删除失败');
      }

      toast.success('批量删除成功');
      router.refresh();
    } catch (error) {
      console.error('Failed to batch delete:', error);
      toast.error(error instanceof Error ? error.message : '批量删除失败，请重试');
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    if (movingId) return; // 防止重复点击

    setMovingId(id);
    try {
      const res = await fetch(`/api/admin/assets/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '移动失败');
      }

      toast.success('素材排序更新成功');
      router.refresh();
    } catch (error) {
      console.error('Failed to move asset:', error);
      toast.error(error instanceof Error ? error.message : '移动失败，请重试');
    } finally {
      setMovingId(null);
    }
  };

  // ---- 分页 ----
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    const total = pagination.totalPages;
    const current = pagination.page;

    // 始终显示第一页
    pages.push(1);
    if (current > 3) pages.push('...');

    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }

    if (current < total - 2) pages.push('...');
    if (total > 1) pages.push(total);

    return (
      <div className="flex items-center justify-center gap-2 mt-6 py-4">
        {pages.map((p, idx) =>
          typeof p === 'string' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-zinc-600">...</span>
          ) : (
            <button
              key={p}
              onClick={() => router.push(buildUrl({ page: String(p) }))}
              className={cn(
                'min-w-[36px] h-9 px-3 rounded-lg text-sm font-bold transition-all',
                p === current
                  ? 'bg-brand-primary text-black'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'
              )}
            >
              {p}
            </button>
          )
        )}
        {pagination.hasNext && (
          <button
            onClick={() => router.push(buildUrl({ page: String(current + 1) }))}
            className="px-4 h-9 rounded-lg text-sm font-bold bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10 transition-all"
          >
            下一页
          </button>
        )}
      </div>
    );
  };

  // ==================== 渲染 ====================
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 顶部 Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">素材管理</h1>
          <p className="text-zinc-500 text-sm flex items-center gap-2 mt-1">
            素材列表
            <span className="text-brand-primary font-mono font-bold">
              总数: {pagination.total}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            defaultValue={initialCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="glass-input bg-zinc-900 text-sm px-3 py-2"
          >
            <option value="all">全部分类</option>
            {flattenCategories(categories).map((c, idx) => (
              <option key={`${c.id}-${idx}`} value={c.id}>
                {'\u00A0'.repeat(c.level * 2)}{c.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索素材标题"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="glass-input pl-3 pr-3 w-48 text-sm py-2"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20 transition-all"
          >
            <Search size={14} className="inline mr-1" />
            搜索
          </button>
          <button
            onClick={handleBatchDelete}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
          >
            <Trash size={14} className="inline mr-1" />
            删除全部
          </button>
          <button
            onClick={() => openModal()}
            className="cyber-button text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            添加素材
          </button>
        </div>
      </header>

      {/* 表格 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">预览</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">素材标题</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">所属分类</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">下载权限</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">版权信息</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">查看数</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">下载链接</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">创建时间</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">状态</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-zinc-500">
                    未找到匹配的素材。
                  </td>
                </tr>
              ) : (
                assets.map((asset: Asset) => {
                  const perm = PERMISSION_LABELS[asset.downloadPermission] || PERMISSION_LABELS.all;
                  return (
                    <tr
                      key={asset.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {/* 预览 */}
                      <td className="px-4 py-3">
                        <div className="w-14 h-14 rounded-lg bg-white/5 overflow-hidden border border-white/10 relative">
                          {asset.thumbnail ? (
                            <Image
                              src={`/api/assets/${asset.id}/thumbnail`}
                              alt=""
                              fill
                              sizes="56px"
                              loading="lazy"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      {/* 标题 */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-white/90 line-clamp-1">{asset.title}</span>
                      </td>
                      {/* 分类 */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold bg-white/5 text-zinc-400 px-2 py-1 rounded border border-white/10">
                          {asset.assetCategory?.name || '未分类'}
                        </span>
                      </td>
                      {/* 下载权限 */}
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-bold px-2 py-1 rounded border', perm.className)}>
                          {perm.text}
                        </span>
                      </td>
                      {/* 版权信息 */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-zinc-400">
                          {COPYRIGHT_LABELS[asset.copyrightType] || '无'}
                        </span>
                      </td>
                      {/* 查看数 */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-zinc-300">{asset.viewCount?.toLocaleString() || 0}</span>
                      </td>
                      {/* 下载链接 */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => window.open(asset.downloadUrl, '_blank')}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          title={asset.downloadUrl}
                        >
                          <Download size={12} />
                          下载
                        </button>
                      </td>
                      {/* 创建时间 */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-zinc-500 font-mono">
                          {formatDate(asset.createdAt)}
                        </span>
                      </td>
                      {/* 状态 */}
                      <td className="px-4 py-3">
                        {asset.status === 'active' ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={12} /> 启用
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                            <XCircle size={12} /> 禁用
                          </span>
                        )}
                      </td>
                      {/* 操作 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleMove(asset.id, 'up')}
                            disabled={movingId === asset.id}
                            className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors"
                            title="上移"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMove(asset.id, 'down')}
                            disabled={movingId === asset.id}
                            className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors"
                            title="下移"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            onClick={() => openModal(asset)}
                            className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-brand-primary transition-colors"
                            title="编辑"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-red-500 transition-colors"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {renderPagination()}
      </div>

      {/* ==================== 添加/编辑弹窗 ==================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-bg-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* 弹窗顶部 */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-brand-primary/5 to-transparent shrink-0">
                <h2 className="text-xl font-display font-bold">
                  {editingAsset ? '编辑素材' : '添加素材'}
                </h2>
                <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* 弹窗内容 - 单列滚动 */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 素材标题 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <ImageIcon size={14} className="text-brand-primary" />
                    素材标题 <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full glass-input"
                    placeholder="请输入素材标题，如：创意图标素材包"
                  />
                </div>

                {/* 所属分类 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Hash size={14} className="text-brand-primary" />
                    所属分类 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full glass-input bg-zinc-900"
                  >
                    <option value="">请选择分类</option>
                    {flattenCategories(categories).map((c, idx) => (
                      <option key={`${c.id}-${idx}`} value={c.id}>
                        {'\u00A0'.repeat(c.level * 4)}{c.level > 0 ? '└─ ' : ''}{c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-600">选择素材所属的分类（包括主导航和子导航）</p>
                </div>

                {/* 素材图片 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <ImageIcon size={14} className="text-brand-primary" />
                    素材图片
                  </label>
                  <ImageUploader
                    value={formData.thumbnail}
                    onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                    placeholder="点击或拖拽缩略图到此处上传"
                  />
                </div>

                {/* 下载权限 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Shield size={14} className="text-brand-primary" />
                    下载权限
                  </label>
                  <select
                    value={formData.downloadPermission}
                    onChange={(e) => setFormData({ ...formData, downloadPermission: e.target.value })}
                    className="w-full glass-input bg-zinc-900"
                  >
                    <option value="all">所有人均可下载</option>
                    <option value="member_only">仅会员可下载</option>
                    <option value="specific_level">指定等级可下载</option>
                  </select>
                  <p className="text-xs text-zinc-600">设置单一会员等级可以下载此素材，选择&quot;所有人均可下载&quot;则不限制</p>
                  {formData.downloadPermission === 'specific_level' && (
                    <input
                      type="text"
                      value={formData.permissionLevel}
                      onChange={(e) => setFormData({ ...formData, permissionLevel: e.target.value })}
                      className="w-full glass-input mt-2"
                      placeholder="输入会员等级标识"
                    />
                  )}
                </div>

                {/* 下载方式 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Link2 size={14} className="text-brand-primary" />
                    下载方式
                  </label>
                  <select
                    value={formData.downloadMethod}
                    onChange={(e) => setFormData({ ...formData, downloadMethod: e.target.value })}
                    className="w-full glass-input bg-zinc-900"
                  >
                    <option value="direct">浏览器直链下载</option>
                    <option value="proxy">服务器代理下载</option>
                    <option value="cloud">网盘跳转</option>
                  </select>
                  <p className="text-xs text-zinc-600">选择素材的下载方式</p>
                </div>

                {/* 下载链接 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Link2 size={14} className="text-brand-primary" />
                    下载链接
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.downloadUrl}
                    onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                    className="w-full glass-input"
                    placeholder="请输入素材下载链接，例如：https://example.com/download/file.zip"
                  />
                  <p className="text-xs text-zinc-600">用户点击&quot;立即下载&quot;按钮时将使用此链接</p>
                </div>

                {/* 存储引擎 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">存储引擎</label>
                  <select
                    value={formData.storageProvider}
                    onChange={(e) => setFormData({ ...formData, storageProvider: e.target.value })}
                    className="w-full glass-input bg-zinc-900"
                  >
                    <option value="AList">AList 存储</option>
                    <option value="123Pan">123云盘</option>
                    <option value="Juhe">聚合网盘</option>
                    <option value="Direct">直链/其他</option>
                  </select>
                </div>

                {/* 版权信息 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Copyright size={14} className="text-brand-primary" />
                    版权信息
                  </label>
                  <select
                    value={formData.copyrightType}
                    onChange={(e) => setFormData({ ...formData, copyrightType: e.target.value })}
                    className="w-full glass-input bg-zinc-900"
                  >
                    <option value="none">不显示版权信息</option>
                    <option value="original">原创</option>
                    <option value="commercial">商用授权</option>
                    <option value="cc">CC协议</option>
                  </select>
                  <p className="text-xs text-zinc-600">选择版权标签后将显示在素材左上角</p>
                </div>

                {/* 显示创建时间 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Clock size={14} className="text-brand-primary" />
                    显示创建时间
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="showCreatedTime"
                        checked={formData.showCreatedTime}
                        onChange={() => setFormData({ ...formData, showCreatedTime: true })}
                        className="text-brand-primary"
                      />
                      <span className="text-sm text-zinc-300">显示时间</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="showCreatedTime"
                        checked={!formData.showCreatedTime}
                        onChange={() => setFormData({ ...formData, showCreatedTime: false })}
                        className="text-brand-primary"
                      />
                      <span className="text-sm text-zinc-300">不显示</span>
                    </label>
                  </div>
                  <p className="text-xs text-zinc-600">开启后，素材右上角将显示创建时间</p>
                </div>

                {/* 排序顺序 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <ArrowUpDown size={14} className="text-brand-primary" />
                    排序顺序
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full glass-input"
                  />
                  <p className="text-xs text-zinc-600">数字越大越靠前，默认为0。如果为0或未填写，系统将自动分配排序值（递减, -1）</p>
                </div>

                {/* 状态 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full glass-input bg-zinc-900"
                  >
                    <option value="active">启用</option>
                    <option value="disabled">禁用</option>
                  </select>
                </div>
              </form>

              {/* 底部按钮 */}
              <div className="p-6 border-t border-white/10 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="cyber-button text-sm flex items-center gap-2 min-w-[120px] justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : editingAsset ? (
                    '保存'
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
