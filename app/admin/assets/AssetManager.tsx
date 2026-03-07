'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  X,
  Loader2,
  UploadCloud,
  Image as ImageIcon,
  Database,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Asset } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AssetManager({
  initialAssets,
  categories,
}: {
  initialAssets: Asset[];
  categories: any[];
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'download' | 'other'>('basic');
  const router = useRouter();

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === 'all' ? true : asset.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    categoryId: '',
    tags: '',
    downloadUrl: '',
    storageProvider: 'AList',
    isDirectDownload: false,
  });

  const openModal = (asset: Asset | null = null) => {
    setActiveTab('basic');
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
      });
    } else {
      setEditingAsset(null);
      setFormData({
        title: '',
        description: '',
        thumbnail: '',
        categoryId: categories[0]?.id || '',
        tags: '',
        downloadUrl: '',
        storageProvider: 'AList',
        isDirectDownload: false,
      });
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
    };

    try {
      const url = editingAsset ? `/api/admin/assets/${editingAsset.id}` : '/api/admin/assets';
      const method = editingAsset ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.refresh();
        closeModal();
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to save asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个素材吗？')) return;

    try {
      const res = await fetch(`/api/admin/assets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAssets(assets.filter((a) => a.id !== id));
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-display font-bold">素材管理</h1>
          <p className="text-zinc-500 text-sm">上传、编辑或删除您的动画素材资源。</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="搜索素材..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-12 w-64"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="glass-input bg-zinc-900 text-sm px-4 py-2"
          >
            <option value="all">所有分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => openModal()}
            className="cyber-button text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            新增素材
          </button>
        </div>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="table-responsive">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                素材预览与名称
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                分类
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                下载统计
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500 text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                  未找到匹配的素材。
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset: Asset) => (
                <tr
                  key={asset.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden border border-white/10 relative group-hover:border-brand-primary/30 transition-all">
                        {asset.thumbnail ? (
                          asset.category === 'video' ||
                          asset.thumbnail.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                            <video
                              src={`/api/assets/${asset.id}/thumbnail`}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <Image
                              src={`/api/assets/${asset.id}/thumbnail`}
                              alt=""
                              fill
                              sizes="64px"
                              loading="lazy"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white/90">{asset.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          {asset.isDirectDownload ? (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              Direct
                            </span>
                          ) : (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                              Proxy
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ID: {asset.id.substring(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-zinc-400 px-2.5 py-1 rounded-lg border border-white/10">
                      {asset.assetCategory?.name || '未分类'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-mono font-bold text-brand-primary">
                        {asset.downloadCount}
                      </span>
                      <span className="text-[10px] text-zinc-600 uppercase tracking-tighter">
                        累计下载
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => window.open(`/api/assets/${asset.id}/thumbnail`, '_blank')}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors"
                        title="查看预览"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openModal(asset)}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-brand-primary transition-colors"
                        title="编辑素材"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-500 transition-colors"
                        title="删除素材"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
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
              className="relative w-full max-w-4xl bg-bg-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex h-[600px]"
            >
              {/* Sidebar */}
              <div className="w-48 border-r border-white/10 bg-white/[0.02] p-4 flex flex-col gap-2">
                <div className="mb-4 px-2">
                  <h2 className="text-lg font-display font-bold">
                    {editingAsset ? '编辑素材' : '新增素材'}
                  </h2>
                </div>
                {[
                  { id: 'basic', label: '基本信息', icon: Database },
                  { id: 'download', label: '下载设置', icon: UploadCloud },
                  { id: 'other', label: '其他设置', icon: Settings },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
                      activeTab === tab.id
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    {activeTab === 'basic'
                      ? '基本信息'
                      : activeTab === 'download'
                        ? '下载设置'
                        : '其他设置'}
                  </span>
                  <button onClick={closeModal} className="text-zinc-500 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
                  {activeTab === 'basic' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                            素材标题
                          </label>
                          <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full glass-input"
                            placeholder="例如：赛博朋克角色模型"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                            所属分类
                          </label>
                          <select
                            value={formData.categoryId}
                            onChange={(e) =>
                              setFormData({ ...formData, categoryId: e.target.value })
                            }
                            className="w-full glass-input bg-zinc-900"
                          >
                            <option value="">未分类</option>
                            {(() => {
                              const flatten = (items: any[], level: number = 0): any[] => {
                                return items.reduce((acc, item) => {
                                  acc.push({ id: item.id, name: item.name, level });
                                  if (item.children) acc.push(...flatten(item.children, level + 1));
                                  return acc;
                                }, []);
                              };
                              return flatten(categories).map((c) => (
                                <option key={c.id} value={c.id}>
                                  {'\u00A0'.repeat(c.level * 4)}
                                  {c.name}
                                </option>
                              ));
                            })()}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                          素材描述
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          className="w-full glass-input min-h-[120px]"
                          placeholder="简要介绍素材的特点和用途..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                          标签 (逗号分隔)
                        </label>
                        <input
                          type="text"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          className="w-full glass-input"
                          placeholder="3D, 动画, 角色"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'download' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                            存储引擎
                          </label>
                          <select
                            value={formData.storageProvider}
                            onChange={(e) =>
                              setFormData({ ...formData, storageProvider: e.target.value })
                            }
                            className="w-full glass-input bg-zinc-900"
                          >
                            <option value="AList">AList 存储</option>
                            <option value="123Pan">123云盘</option>
                            <option value="Juhe">聚合网盘</option>
                            <option value="Direct">直链/其他</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                            下载链接 / 文件 ID
                          </label>
                          <input
                            required
                            type="text"
                            value={formData.downloadUrl}
                            onChange={(e) =>
                              setFormData({ ...formData, downloadUrl: e.target.value })
                            }
                            className="w-full glass-input"
                            placeholder="路径或 ID"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <input
                          type="checkbox"
                          id="isDirectDownload"
                          checked={formData.isDirectDownload}
                          onChange={(e) =>
                            setFormData({ ...formData, isDirectDownload: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-white/10 bg-zinc-900 text-brand-primary focus:ring-brand-primary"
                        />
                        <label
                          htmlFor="isDirectDownload"
                          className="text-xs text-text-secondary cursor-pointer select-none"
                        >
                          <span className="font-bold text-text-primary">开启直链下载 (推荐)</span>
                          <p className="mt-0.5 opacity-60">
                            开启后，用户下载将直接跳转到网盘直链，不经过服务器中转。
                          </p>
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'other' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                          预览图/视频 URL
                        </label>
                        <input
                          type="text"
                          value={formData.thumbnail}
                          onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                          className="w-full glass-input"
                          placeholder="https://.../preview.jpg"
                        />
                        <div className="mt-4 w-full aspect-video rounded-xl bg-white/5 border border-white/10 overflow-hidden relative">
                          {formData.thumbnail ? (
                            <Image
                              src={formData.thumbnail}
                              className="w-full h-full object-cover"
                              alt="Preview"
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              预览图预览
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </form>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/[0.01]">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/5 transition-colors"
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
                      '更新素材'
                    ) : (
                      '确认发布'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
