'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Folder,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Home,
  List,
  FileText,
  Download,
  Image,
  Edit,
  Settings,
  ExternalLink,
  Monitor,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  NAVIGATION_TEMPLATES,
  INTERNAL_MODULES,
  getNavigationTemplate,
  type NavigationTemplateType,
} from '@/lib/constants/navigation-templates';
import { useCsrf } from '@/hooks/use-csrf';

// ==================== 图标映射 ====================

const ICON_MAP: Record<string, any> = {
  Home,
  List,
  FileText,
  Folder,
  Download,
  Image,
  Edit,
  Settings,
  ExternalLink,
  Monitor,
};

function flattenCategories(items: any[], level: number = 0): any[] {
  return items.reduce((acc, item) => {
    acc.push({ id: item.id, name: item.name, level });
    if (item.children) acc.push(...flattenCategories(item.children, level + 1));
    return acc;
  }, []);
}

// ==================== 组件 ====================

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
  const [movingId, setMovingId] = useState<string | null>(null);
  const router = useRouter();
  const { csrfFetch } = useCsrf();

  // 同步 initialItems 的变化
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const emptyForm = {
    name: '',
    targetType: 'INTERNAL',
    templateType: 'custom',
    targetValue: 'HOME',
    order: 0,
    status: 'active',
    description: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  const openModal = (item: any | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        targetType: item.targetType || 'INTERNAL',
        templateType: item.templateType || 'custom',
        targetValue: item.targetValue || 'HOME',
        order: item.order,
        status: item.status || 'active',
        description: item.description || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        ...emptyForm,
        order: items.length,
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

    // 前端验证：外部链接类型必须填写URL
    if (formData.targetType === 'EXTERNAL' && !formData.targetValue.trim()) {
      toast.error('请填写外部链接地址');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingItem
        ? `/api/admin/navigation/${editingItem.id}`
        : '/api/admin/navigation';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await csrfFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '保存失败');
      }

      const result = await res.json();

      // 乐观更新本地状态 - 立即反映变化，无需等待刷新
      if (editingItem) {
        // 编辑模式：更新现有项
        setItems(items.map(item =>
          item.id === editingItem.id ? { ...item, ...formData } : item
        ));
        toast.success('导航更新成功');
      } else {
        // 新增模式：添加新项
        setItems([...items, result.data]);
        toast.success('导航添加成功');
      }

      // 关闭弹窗
      closeModal();

      // 后台刷新数据确保一致性
      router.refresh();

    } catch (error) {
      console.error('Failed to save nav item:', error);
      toast.error(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个导航项吗？')) return;

    try {
      const res = await csrfFetch(`/api/admin/navigation/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '删除失败');
      }

      // 乐观更新本地状态
      setItems(items.filter((i) => i.id !== id));
      toast.success('导航删除成功');

      // 后台刷新数据
      router.refresh();
    } catch (error) {
      console.error('Failed to delete nav item:', error);
      toast.error(error instanceof Error ? error.message : '删除失败，请重试');
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    // 防止重复点击
    if (movingId) return;

    setMovingId(id);

    // 找到当前项的索引
    const currentIndex = items.findIndex(i => i.id === id);
    if (currentIndex === -1) {
      toast.error('导航项不存在');
      setMovingId(null);
      return;
    }

    // 计算目标索引
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // 边界检查
    if (targetIndex < 0 || targetIndex >= items.length) {
      toast.warning(direction === 'up' ? '已经是第一项' : '已经是最后一项');
      setMovingId(null);
      return;
    }

    // 乐观更新：立即交换本地状态中的位置
    const newItems = [...items];
    [newItems[currentIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[currentIndex]];
    setItems(newItems);

    try {
      const res = await csrfFetch(`/api/admin/navigation/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '移动失败');
      }

      toast.success('排序更新成功');

      // 后台刷新数据确保一致性
      router.refresh();

    } catch (error) {
      console.error('Failed to move nav item:', error);
      toast.error(error instanceof Error ? error.message : '移动失败，请重试');

      // 失败时回滚到原始状态
      setItems(items);
    } finally {
      setMovingId(null);
    }
  };

  const getTargetLabel = (item: any) => {
    if (item.targetType === 'INTERNAL') {
      return INTERNAL_MODULES.find((m) => m.id === item.targetValue)?.name || item.targetValue;
    }
    if (item.targetType === 'CATEGORY') {
      const flat = flattenCategories(categories);
      return flat.find((c) => c.id === item.targetValue)?.name || '未知分类';
    }
    return item.targetValue;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">顶部导航设置</h1>
          <p className="text-zinc-500 text-sm mt-1">管理站点顶部导航栏，配置模板类型与跳转目标。</p>
        </div>
        <button
          onClick={() => openModal()}
          className="cyber-button text-sm flex items-center gap-2"
        >
          <Plus size={16} />
          添加导航
        </button>
      </header>

      {/* 导航列表标题 */}
      <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
        <Folder size={16} className="text-brand-primary" />
        现有导航列表
      </div>

      {/* 表格 */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500 w-16">
                序号
              </th>
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">
                导航名称
              </th>
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">
                模板类型
              </th>
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500">
                状态
              </th>
              <th className="px-5 py-3 text-xs font-mono uppercase tracking-widest text-zinc-500 text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                  暂无导航项，请点击上方按钮添加。
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const template = getNavigationTemplate(item.templateType);
                const TemplateIcon = ICON_MAP[template.icon] || Settings;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    {/* 序号 */}
                    <td className="px-5 py-4 text-sm text-zinc-400 font-mono">
                      {index + 1}
                    </td>
                    {/* 导航名称 */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Folder size={16} className="text-amber-400" />
                        <span className="text-sm font-bold text-white/90">{item.name}</span>
                      </div>
                    </td>
                    {/* 模板类型 */}
                    <td className="px-5 py-4">
                      <span className={cn(
                        'text-xs font-bold px-2.5 py-1 rounded border inline-flex items-center gap-1.5',
                        template.className
                      )}>
                        <TemplateIcon size={12} />
                        {template.label}
                      </span>
                    </td>
                    {/* 状态 */}
                    <td className="px-5 py-4">
                      {item.status === 'active' ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={13} /> 启用
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                          <XCircle size={13} /> 禁用
                        </span>
                      )}
                    </td>
                    {/* 操作 */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleMove(item.id, 'up')}
                          disabled={movingId !== null || index === 0}
                          className={cn(
                            "p-1.5 rounded-lg bg-white/5 transition-colors",
                            movingId !== null || index === 0
                              ? "text-zinc-700 cursor-not-allowed"
                              : "text-zinc-500 hover:text-white"
                          )}
                          title={index === 0 ? "已经是第一项" : "上移"}
                          aria-label={index === 0 ? "已经是第一项" : "上移"}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMove(item.id, 'down')}
                          disabled={movingId !== null || index === items.length - 1}
                          className={cn(
                            "p-1.5 rounded-lg bg-white/5 transition-colors",
                            movingId !== null || index === items.length - 1
                              ? "text-zinc-700 cursor-not-allowed"
                              : "text-zinc-500 hover:text-white"
                          )}
                          title={index === items.length - 1 ? "已经是最后一项" : "下移"}
                          aria-label={index === items.length - 1 ? "已经是最后一项" : "下移"}
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => openModal(item)}
                          className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-brand-primary transition-colors"
                          title="编辑"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
              className="relative w-full max-w-lg bg-bg-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-brand-primary/5 to-transparent shrink-0">
                <h2 className="text-xl font-display font-bold">
                  {editingItem ? '编辑导航' : '添加导航'}
                </h2>
                <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 导航名称 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">
                    导航名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full glass-input"
                    placeholder="例如：首页、AN动画教学"
                  />
                </div>

                {/* 模板类型 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">
                    模板类型 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.templateType}
                    onChange={(e) => {
                      const templateType = e.target.value as NavigationTemplateType;
                      const template = getNavigationTemplate(templateType);

                      // 根据模板自动设置目标类型和默认值
                      setFormData({
                        ...formData,
                        templateType,
                        targetType: template.defaultTargetType,
                        targetValue: template.defaultTargetValue,
                      });
                    }}
                    className="w-full glass-input bg-zinc-900"
                  >
                    <optgroup label="基础页面">
                      <option value="home">🏠 首页 - 网站主页</option>
                      <option value="list">📋 列表页 - 内容列表展示</option>
                      <option value="detail">📄 详情页 - 单项内容详情</option>
                      <option value="category">📁 分类页 - 分类浏览</option>
                    </optgroup>
                    <optgroup label="功能页面">
                      <option value="download">⬇️ 下载中心 - 资源下载</option>
                      <option value="gallery">🖼️ 画廊 - 图片/视频展示</option>
                      <option value="form">✏️ 表单页 - 数据提交</option>
                    </optgroup>
                    <optgroup label="扩展类型">
                      <option value="custom">⚙️ 自定义 - 自定义页面</option>
                      <option value="external">🔗 外部链接 - 跳转外部网站</option>
                      <option value="iframe">🖥️ 嵌入页 - 嵌入第三方页面</option>
                    </optgroup>
                  </select>
                  <p className="text-xs text-zinc-600">
                    {getNavigationTemplate(formData.templateType).description}
                  </p>
                </div>

                {/* 目标类型 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">跳转目标</label>
                  <select
                    value={formData.targetType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetType: e.target.value,
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
                    <option value="INTERNAL">📦 内部页面 - 跳转到系统内置页面</option>
                    <option value="CATEGORY">📁 分类页面 - 跳转到素材分类</option>
                    <option value="EXTERNAL">🔗 外部链接 - 跳转到外部网站</option>
                  </select>
                  <p className="text-xs text-zinc-600">
                    {formData.targetType === 'INTERNAL' && '选择系统内置的功能页面'}
                    {formData.targetType === 'CATEGORY' && '选择素材分类，显示该分类下的所有素材'}
                    {formData.targetType === 'EXTERNAL' && '输入完整的外部链接地址（如：https://example.com）'}
                  </p>
                </div>

                {/* 目标内容 - 根据类型切换 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">
                    {formData.targetType === 'INTERNAL' && '选择内部页面'}
                    {formData.targetType === 'CATEGORY' && '选择素材分类'}
                    {formData.targetType === 'EXTERNAL' && '输入外部链接'}
                  </label>
                  {formData.targetType === 'INTERNAL' && (
                    <>
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
                      <p className="text-xs text-zinc-600">
                        💡 提示：内部页面是系统预设的功能模块
                      </p>
                    </>
                  )}
                  {formData.targetType === 'CATEGORY' && (
                    <>
                      <select
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                        className="w-full glass-input bg-zinc-900"
                      >
                        {flattenCategories(categories).map((c, idx) => (
                          <option key={`${c.id}-${idx}`} value={c.id}>
                            {'\u00A0'.repeat(c.level * 4)}{c.level > 0 ? '└─ ' : ''}{c.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-zinc-600">
                        💡 提示：在"素材分类设置"中管理分类，点击导航后将显示该分类下的所有素材
                      </p>
                    </>
                  )}
                  {formData.targetType === 'EXTERNAL' && (
                    <>
                      <input
                        type="url"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                        className="w-full glass-input"
                        placeholder="https://example.com"
                        required={formData.targetType === 'EXTERNAL'}
                      />
                      <p className="text-xs text-zinc-600">
                        💡 提示：外部链接将在新标签页打开，请输入完整的URL地址
                      </p>
                    </>
                  )}
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

                {/* 描述 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">描述（可选）</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full glass-input"
                    placeholder="简要说明此导航的用途"
                  />
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
                  ) : editingItem ? (
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
