'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Folder,
  FolderOpen,
  Database,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCsrf } from '@/hooks/use-csrf';

// ==================== 辅助函数 ====================

function flattenCategories(
  items: any[],
  level: number = 0,
  excludeId?: string
): { id: string; name: string; level: number }[] {
  return items.reduce((acc, item) => {
    if (item.id !== excludeId) {
      acc.push({ id: item.id, name: item.name, level });
      if (item.children) {
        acc.push(...flattenCategories(item.children, level + 1, excludeId));
      }
    }
    return acc;
  }, [] as { id: string; name: string; level: number }[]);
}

/** 统计分类总数（含子分类） */
function countCategories(items: any[]): number {
  return items.reduce((sum, item) => {
    return sum + 1 + (item.children ? countCategories(item.children) : 0);
  }, 0);
}

/** 获取同级列表中的索引 */
function getSiblingIndex(items: any[], id: string, parentId: string | null): { index: number; total: number } {
  const siblings = parentId
    ? findChildren(items, parentId)
    : items;
  const index = siblings.findIndex((s: any) => s.id === id);
  return { index, total: siblings.length };
}

function findChildren(items: any[], parentId: string): any[] {
  for (const item of items) {
    if (item.id === parentId) return item.children || [];
    if (item.children) {
      const found = findChildren(item.children, parentId);
      if (found.length > 0 || item.children.some((c: any) => c.id === parentId)) {
        const parent = item.children.find((c: any) => c.id === parentId);
        if (parent) return parent.children || [];
        return findChildren(item.children, parentId);
      }
    }
  }
  return [];
}

// ==================== 组件 ====================

export default function CategoryManager({ initialCategories, navigations }: { initialCategories: any[], navigations: any[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {    // 默认展开所有有子分类的节点
    const ids = new Set<string>();
    const collect = (items: any[]) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          ids.add(item.id);
          collect(item.children);
        }
      });
    };
    collect(initialCategories);
    return ids;
  });
  const [movingId, setMovingId] = useState<string | null>(null);
  const router = useRouter();
  const { csrfFetch } = useCsrf();

  // 同步服务器端数据更新到本地状态
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    navigationId: '',
    order: 0,
    status: 'active',
    icon: '',
  });

  const totalCount = countCategories(categories);

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
        navigationId: category.navigationId || '',
        order: category.order,
        status: category.status || 'active',
        icon: category.icon || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        parentId: parentId,
        navigationId: '',
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

      const payload = {
        ...formData,
        parentId: formData.parentId === '' ? null : formData.parentId,
        navigationId: formData.navigationId === '' ? null : formData.navigationId,
      };

      const res = await csrfFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '保存失败');
      }

      const result = await res.json();
      toast.success(editingCategory ? '分类更新成功' : '分类创建成功');

      closeModal();

      // 乐观更新：立即刷新数据
      router.refresh();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？如果有子分类或关联素材，可能会导致数据问题。')) return;

    try {
      const res = await csrfFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '删除失败');
      }

      toast.success('分类删除成功');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error(error instanceof Error ? error.message : '删除失败，请重试');
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    if (movingId) return; // 防止重复点击

    setMovingId(id);
    try {
      const res = await csrfFetch(`/api/admin/categories/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '移动失败');
      }

      toast.success('分类排序更新成功');
      router.refresh();
    } catch (error) {
      console.error('Failed to move category:', error);
      toast.error(error instanceof Error ? error.message : '移动失败，请重试');
    } finally {
      setMovingId(null);
    }
  };

  // ==================== 树形行渲染 ====================

  let globalIndex = 0;

  const renderCategoryRow = (cat: any, level: number = 0) => {
    const isExpanded = expandedIds.has(cat.id);
    const hasChildren = cat.children && cat.children.length > 0;
    globalIndex++;
    const rowIndex = globalIndex;

    return (
      <div key={cat.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-5 py-3.5 border-b border-white/5 hover:bg-white/5 transition-colors',
            level > 0 && 'bg-white/[0.01]'
          )}
        >
          {/* 序号 */}
          <div className="w-12 shrink-0 text-sm text-zinc-500 font-mono text-center">
            {rowIndex}
          </div>

          {/* 分类名称 */}
          <div
            style={{ paddingLeft: `${level * 20}px` }}
            className="flex items-center gap-2.5 flex-1 min-w-0"
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(cat.id)}
                className="text-zinc-500 hover:text-white transition-colors shrink-0"
              >
                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            ) : (
              <div className="w-[15px] shrink-0" />
            )}
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen size={16} className="text-amber-400 shrink-0" />
              ) : (
                <Folder size={16} className="text-amber-400 shrink-0" />
              )
            ) : (
              <Database size={16} className="text-zinc-500 shrink-0" />
            )}
            <span className="text-sm font-bold text-white/90 truncate">{cat.name}</span>
            {cat.icon && (
              <span className="text-xs text-zinc-600 font-mono">({cat.icon})</span>
            )}
            {cat.navigationId && (() => {
              const nav = navigations.find((n: any) => n.id === cat.navigationId);
              return nav ? (
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shrink-0">
                  {nav.name}
                </span>
              ) : null;
            })()}
          </div>

          {/* 状态 */}
          <div className="w-20 shrink-0">
            {cat.status === 'active' ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> 启用
              </span>
            ) : (
              <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                <XCircle size={13} /> 禁用
              </span>
            )}
          </div>

          {/* 操作 */}
          <div className="flex items-center justify-end gap-1 shrink-0">
            <button
              onClick={() => handleMove(cat.id, 'up')}
              disabled={movingId === cat.id}
              className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors"
              title="上移（同级）"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => handleMove(cat.id, 'down')}
              disabled={movingId === cat.id}
              className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors"
              title="下移（同级）"
            >
              <ChevronDown size={14} />
            </button>
            <button
              onClick={() => openModal(null, cat.id)}
              className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-emerald-400 transition-colors"
              title="添加子分类"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => openModal(cat)}
              className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-brand-primary transition-colors"
              title="编辑"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-red-500 transition-colors"
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* 子分类递归渲染 */}
        {hasChildren && isExpanded && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            {cat.children.map((child: any) => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // 每次 render 重置全局序号
  globalIndex = 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">素材分类设置</h1>
          <p className="text-zinc-500 text-sm mt-1">管理素材的分类结构，支持多级嵌套与排序。</p>
        </div>
        <button
          onClick={() => openModal()}
          className="cyber-button text-sm flex items-center gap-2"
        >
          <Plus size={16} />
          新增一级分类
        </button>
      </header>

      {/* 列表标题 */}
      <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
        <Folder size={16} className="text-brand-primary" />
        分类列表
        <span className="text-xs font-normal text-zinc-500 ml-1">
          共 {totalCount} 个分类
        </span>
      </div>

      {/* 树形表格 */}
      <div className="glass-card overflow-hidden">
        {/* 表头 */}
        <div className="bg-white/5 px-5 py-3 border-b border-white/10">
          <div className="flex items-center text-xs font-mono uppercase tracking-widest text-zinc-500">
            <span className="w-12 shrink-0 text-center">序号</span>
            <span className="flex-1">分类名称</span>
            <span className="w-20 shrink-0">状态</span>
            <span className="min-w-[180px] shrink-0 text-right">操作</span>
          </div>
        </div>

        {/* 内容 */}
        <div>
          {categories.length === 0 ? (
            <div className="px-6 py-16 text-center text-zinc-500">
              暂无分类，请点击上方按钮添加。
            </div>
          ) : (
            categories.map((cat) => renderCategoryRow(cat))
          )}
        </div>
      </div>

      {/* ==================== 新增/编辑弹窗 ==================== */}
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
              className="relative w-full max-w-md bg-bg-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-brand-primary/5 to-transparent shrink-0">
                <h2 className="text-xl font-display font-bold">
                  {editingCategory ? '编辑分类' : formData.parentId ? '新增子分类' : '新增一级分类'}
                </h2>
                <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 分类名称 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">
                    分类名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full glass-input"
                    placeholder="例如：角色模型、场景素材"
                  />
                </div>

                {/* 父级分类 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">所属导航</label>
                  <select
                    value={formData.navigationId}
                    onChange={(e) => setFormData({ ...formData, navigationId: e.target.value })}
                    className="w-full glass-input bg-zinc-900"
                  >
                    <option value="">无（不关联导航）</option>
                    {navigations.filter(nav => nav.status === 'active').map((nav) => (
                      <option key={nav.id} value={nav.id}>
                        {nav.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-600">选择后，该分类及其素材将只在对应导航项下显示</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">父级分类</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full glass-input bg-zinc-900"
                  >
                    <option value="">无（作为一级分类）</option>
                    {flattenCategories(categories, 0, editingCategory?.id).map((c) => (
                      <option key={c.id} value={c.id}>
                        {'\u00A0'.repeat(c.level * 4)}
                        {c.level > 0 ? '└─ ' : ''}{c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-600">选择父级后将作为子分类存在</p>
                </div>

                {/* 图标 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">图标（可选）</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full glass-input"
                    placeholder="例如：emoji 或图标名称"
                  />
                </div>

                {/* 状态 + 排序 */}
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-300">排序</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full glass-input"
                    />
                  </div>
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
