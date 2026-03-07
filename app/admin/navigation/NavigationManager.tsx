'use client';

import { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Globe, X, Loader2, Save, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function NavigationManager({
  initialItems,
  categories,
}: {
  initialItems: any[];
  categories: any[];
}) {
  const [items, setItems] = useState(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    targetType: 'INTERNAL',
    targetValue: 'HOME',
    order: 0,
    status: 'active',
  });

  const INTERNAL_MODULES = [
    { id: 'HOME', name: '首页' },
    { id: 'ASSETS', name: '素材库' },
    { id: 'SOFTWARE', name: '常用软件' },
    { id: 'TUTORIALS', name: '动画教学' },
    { id: 'ABOUT', name: '关于我们' },
  ];

  const openModal = (item: any | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        targetType: item.targetType || 'INTERNAL',
        targetValue: item.targetValue || 'HOME',
        order: item.order,
        status: item.status,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        targetType: 'INTERNAL',
        targetValue: 'HOME',
        order: items.length,
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingItem ? `/api/admin/navigation/${editingItem.id}` : '/api/admin/navigation';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.refresh();
        closeModal();
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to save nav item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个导航项吗？')) return;

    try {
      const res = await fetch(`/api/admin/navigation/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter((i) => i.id !== id));
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete nav item:', error);
    }
  };

  const getTargetLabel = (item: any) => {
    if (item.targetType === 'INTERNAL') {
      return INTERNAL_MODULES.find((m) => m.id === item.targetValue)?.name || item.targetValue;
    }
    if (item.targetType === 'CATEGORY') {
      return categories.find((c) => c.id === item.targetValue)?.name || '未知分类';
    }
    return item.targetValue;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-display font-bold">顶部导航设置</h1>
          <p className="text-zinc-500 text-sm">通过业务模块映射配置导航，无需手动输入 URL。</p>
        </div>
        <button
          onClick={() => openModal()}
          className="cyber-button text-sm flex items-center gap-2"
        >
          <Plus size={16} />
          新增导航
        </button>
      </header>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                导航名称
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                目标类型
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                目标内容
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                排序
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500 text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  暂无导航项。
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Globe size={16} className="text-brand-primary" />
                      <span className="text-sm font-bold text-white/90">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-zinc-400 px-2 py-0.5 rounded border border-white/10">
                      {item.targetType === 'INTERNAL'
                        ? '内部模块'
                        : item.targetType === 'CATEGORY'
                          ? '素材分类'
                          : '外部链接'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 font-mono truncate max-w-[200px]">
                    {getTargetLabel(item)}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400 font-mono">{item.order}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-brand-primary transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-bg-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">
                  {editingItem ? '编辑导航' : '新增导航'}
                </h2>
                <button onClick={closeModal} className="text-zinc-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    导航名称
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full glass-input"
                    placeholder="例如：官方网站"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    目标类型
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetType: e.target.value as any,
                        targetValue:
                          e.target.value === 'INTERNAL'
                            ? 'HOME'
                            : e.target.value === 'CATEGORY'
                              ? categories[0]?.id || ''
                              : '',
                      })
                    }
                    className="w-full glass-input bg-zinc-900"
                  >
                    <option value="INTERNAL">内部业务模块</option>
                    <option value="CATEGORY">素材分类页面</option>
                    <option value="EXTERNAL">外部自定义链接</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    目标内容
                  </label>
                  {formData.targetType === 'INTERNAL' && (
                    <select
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      className="w-full glass-input bg-zinc-900"
                    >
                      {INTERNAL_MODULES.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {formData.targetType === 'CATEGORY' && (
                    <select
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      className="w-full glass-input bg-zinc-900"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {formData.targetType === 'EXTERNAL' && (
                    <input
                      required
                      type="text"
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      className="w-full glass-input"
                      placeholder="https://..."
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                      排序
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value) })
                      }
                      className="w-full glass-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                      状态
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full glass-input bg-zinc-900"
                    >
                      <option value="active">显示</option>
                      <option value="hidden">隐藏</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
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
                    ) : editingItem ? (
                      '更新导航'
                    ) : (
                      '确认新增'
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
