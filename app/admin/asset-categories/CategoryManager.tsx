'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Database,
  X,
  Loader2,
  Save,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function CategoryManager({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    order: 0,
    status: 'active',
    icon: '',
  });

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const openModal = (category: any | null = null, parentId: string = '') => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        parentId: category.parentId || '',
        order: category.order,
        status: category.status,
        icon: category.icon || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        parentId: parentId,
        order: 0,
        status: 'active',
        icon: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId === '' ? null : formData.parentId,
        }),
      });

      if (res.ok) {
        router.refresh();
        closeModal();
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？如果有子分类或素材，可能会导致关联问题。')) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const renderCategoryRow = (cat: any, level: number = 0) => {
    const isExpanded = expandedIds.has(cat.id);
    const hasChildren = cat.children && cat.children.length > 0;

    return (
      <div key={cat.id}>
        <div
          className={cn(
            'flex items-center gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors group',
            level > 0 && 'bg-white/[0.01]'
          )}
        >
          <div
            style={{ paddingLeft: `${level * 24}px` }}
            className="flex items-center gap-3 flex-1"
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(cat.id)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div className="w-4" />
            )}
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen size={18} className="text-brand-primary" />
              ) : (
                <Folder size={18} className="text-brand-primary" />
              )
            ) : (
              <Database size={18} className="text-zinc-500" />
            )}
            <span className="text-sm font-bold text-white/90">{cat.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-600">
              ID: {cat.id.substring(0, 8)}
            </span>
            <span className="text-[10px] font-mono text-zinc-600">Order: {cat.order}</span>
          </div>
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity min-w-[120px]">
            <button
              onClick={() => openModal(null, cat.id)}
              className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-brand-primary transition-colors"
              title="添加子分类"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => openModal(cat)}
              className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-brand-primary transition-colors"
              title="编辑分类"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-500 transition-colors"
              title="删除分类"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            {cat.children.map((child: any) => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-display font-bold">素材导航设置</h1>
          <p className="text-zinc-500 text-sm">管理素材的分类结构，支持多级嵌套与排序。</p>
        </div>
        <button
          onClick={() => openModal()}
          className="cyber-button text-sm flex items-center gap-2"
        >
          <Plus size={16} />
          新增一级分类
        </button>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="bg-white/5 px-6 py-4 border-b border-white/10">
          <div className="flex items-center text-xs font-mono uppercase tracking-widest text-zinc-500">
            <span className="flex-1">分类名称</span>
            <span className="min-w-[120px] text-right">操作</span>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {categories.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-500">暂无分类项。</div>
          ) : (
            categories.map((cat) => renderCategoryRow(cat))
          )}
        </div>
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
                  {editingCategory ? '编辑分类' : '新增分类'}
                </h2>
                <button onClick={closeModal} className="text-zinc-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    分类名称
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full glass-input"
                    placeholder="例如：角色模型"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    父级分类
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full glass-input bg-zinc-900"
                  >
                    <option value="">无 (作为一级分类)</option>
                    {/* Flattened list for selection */}
                    {(() => {
                      const flatten = (items: any[], level: number = 0): any[] => {
                        return items.reduce((acc, item) => {
                          acc.push({ id: item.id, name: item.name, level });
                          if (item.children) acc.push(...flatten(item.children, level + 1));
                          return acc;
                        }, []);
                      };
                      return flatten(categories).map((c) => (
                        <option key={c.id} value={c.id} disabled={editingCategory?.id === c.id}>
                          {'\u00A0'.repeat(c.level * 4)}
                          {c.name}
                        </option>
                      ));
                    })()}
                  </select>
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
                      <option value="active">启用</option>
                      <option value="disabled">禁用</option>
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
                    ) : editingCategory ? (
                      '更新分类'
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
