'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  content: string;
  link?: string;
  linkText?: string;
  bgColor: string;
  textColor: string;
  enabled: boolean;
  scrollSpeed: number;
  order: number;
}

export default function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    content: '',
    link: '',
    linkText: '',
    bgColor: '#00ff88',
    textColor: '#000000',
    enabled: true,
    scrollSpeed: 50,
  });

  const openModal = (banner: Banner | null = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        content: banner.content,
        link: banner.link || '',
        linkText: banner.linkText || '',
        bgColor: banner.bgColor,
        textColor: banner.textColor,
        enabled: banner.enabled,
        scrollSpeed: banner.scrollSpeed,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        content: '',
        link: '',
        linkText: '',
        bgColor: '#00ff88',
        textColor: '#000000',
        enabled: true,
        scrollSpeed: 50,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const saved: Banner | null = json ?? null;

        if (editingBanner) {
          setBanners((prev) =>
            prev.map((b) =>
              b.id === editingBanner.id ? { ...b, ...formData, ...(saved || {}) } : b
            )
          );
        } else if (saved) {
          setBanners((prev) => [...prev, saved]);
        }
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save banner:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个横幅公告吗？')) return;

    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBanners(banners.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  const toggleEnabled = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...banner, enabled: !banner.enabled }),
      });

      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, enabled: !b.enabled } : b))
        );
      }
    } catch (error) {
      console.error('Failed to toggle banner:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-display font-bold">横幅公告管理</h1>
          <p className="text-zinc-500 text-sm">管理用户端顶部横幅公告，支持滚动效果和自定义样式。</p>
        </div>
        <button onClick={() => openModal()} className="cyber-button text-sm flex items-center gap-2">
          <Plus size={16} />
          新增横幅
        </button>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  内容预览
                </th>
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  状态
                </th>
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500 text-right">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                    暂无横幅公告。
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr
                    key={banner.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div
                        className="px-4 py-2 rounded-lg text-sm font-bold inline-block"
                        style={{
                          backgroundColor: banner.bgColor,
                          color: banner.textColor,
                        }}
                      >
                        {banner.content}
                        {banner.link && banner.linkText && (
                          <span className="ml-2 underline">{banner.linkText}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border',
                          banner.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        )}
                      >
                        {banner.enabled ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleEnabled(banner)}
                          className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors"
                          title={banner.enabled ? '禁用' : '启用'}
                        >
                          {banner.enabled ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button
                          onClick={() => openModal(banner)}
                          className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-brand-primary transition-colors"
                          title="编辑"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-500 transition-colors"
                          title="删除"
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
              className="relative w-full max-w-2xl bg-bg-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-lg font-display font-bold">
                  {editingBanner ? '编辑横幅' : '新增横幅'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    公告内容
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full glass-input"
                    placeholder="例如：欢迎来到 AnimoSaaS 素材库"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                      链接地址 (可选)
                    </label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full glass-input"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                      链接文字 (可选)
                    </label>
                    <input
                      type="text"
                      value={formData.linkText}
                      onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                      className="w-full glass-input"
                      placeholder="了解更多"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                      背景颜色
                    </label>
                    <div className="flex gap-3">
                      <div
                        className="h-12 w-12 rounded-xl border border-white/10 shadow-inner flex-shrink-0"
                        style={{ backgroundColor: formData.bgColor }}
                      />
                      <input
                        type="text"
                        value={formData.bgColor}
                        onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                        className="flex-1 glass-input font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                      文字颜色
                    </label>
                    <div className="flex gap-3">
                      <div
                        className="h-12 w-12 rounded-xl border border-white/10 shadow-inner flex-shrink-0"
                        style={{ backgroundColor: formData.textColor }}
                      />
                      <input
                        type="text"
                        value={formData.textColor}
                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                        className="flex-1 glass-input font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    滚动速度 (px/s)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={formData.scrollSpeed}
                    onChange={(e) =>
                      setFormData({ ...formData, scrollSpeed: parseInt(e.target.value) })
                    }
                    className="w-full glass-input"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-zinc-900 text-brand-primary focus:ring-brand-primary"
                  />
                  <label htmlFor="enabled" className="text-sm text-zinc-300 cursor-pointer">
                    启用此横幅
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="cyber-button text-sm flex items-center gap-2 min-w-[120px] justify-center"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : editingBanner ? (
                      '更新横幅'
                    ) : (
                      '创建横幅'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
