'use client';

import { useState } from 'react';
import {
  Menu,
  Plus,
  Trash2,
  GripVertical,
  Save,
  ExternalLink,
  Package,
  Play,
  Cpu,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const ModuleOptions = [
  { id: 'HOME', name: '首页', icon: Package },
  { id: 'ASSETS', name: '素材库', icon: Package },
  { id: 'TUTORIALS', name: '动画教学', icon: Play },
  { id: 'SOFTWARE', name: '常用软件', icon: Cpu },
  { id: 'ABOUT', name: '关于我们', icon: Info },
];

export function NavigationManagement({ initialItems }: { initialItems: any[] }) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addItem = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新菜单项',
      targetType: 'INTERNAL',
      targetValue: 'HOME',
      icon: 'Package',
      order: items.length,
      status: 'active',
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }

      toast.success('导航配置已保存');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tighter text-white">导航管理</h1>
          <p className="text-zinc-500 text-sm mt-1">
            配置站点顶部及移动端导航菜单，支持业务模块映射
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all"
          >
            <Plus size={18} />
            添加项
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#00ff88] text-black font-black rounded-full hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? '保存中...' : '保存更改'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {items
          .sort((a, b) => a.order - b.order)
          .map((item, index) => (
            <div key={item.id} className="glass-card p-6 flex items-center gap-6 group">
              <div className="cursor-grab text-zinc-600 hover:text-zinc-400">
                <GripVertical size={20} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    显示名称
                  </label>
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#00ff88] outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    链接类型
                  </label>
                  <select
                    value={item.targetType || 'INTERNAL'}
                    onChange={(e) => updateItem(item.id, { targetType: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#00ff88] outline-none transition-colors appearance-none"
                  >
                    <option value="INTERNAL">业务模块映射</option>
                    <option value="CATEGORY">素材分类</option>
                    <option value="EXTERNAL">外部链接</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    目标值
                  </label>
                  {item.targetType === 'INTERNAL' || !item.targetType ? (
                    <select
                      value={item.targetValue || 'HOME'}
                      onChange={(e) => updateItem(item.id, { targetValue: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#00ff88] outline-none transition-colors appearance-none"
                    >
                      {ModuleOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={item.targetValue || ''}
                      onChange={(e) => updateItem(item.id, { targetValue: e.target.value })}
                      placeholder={item.targetType === 'CATEGORY' ? '输入分类 ID' : 'https://...'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#00ff88] outline-none transition-colors"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    图标
                  </label>
                  <select
                    value={item.icon}
                    onChange={(e) => updateItem(item.id, { icon: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#00ff88] outline-none transition-colors appearance-none"
                  >
                    <option value="Package">包裹 (素材)</option>
                    <option value="Play">播放 (教学)</option>
                    <option value="Cpu">芯片 (软件)</option>
                    <option value="Info">信息 (关于)</option>
                    <option value="ExternalLink">外部链接</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

        {items.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Menu size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-bold">暂无导航项，请点击上方按钮添加</p>
          </div>
        )}
      </div>
    </div>
  );
}
