'use client';

import { useState } from 'react';
import { Palette, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function BrandSettingsForm({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新失败');
      }

      toast.success('品牌设置已更新');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tighter text-white">品牌视觉</h1>
          <p className="text-zinc-500 text-sm mt-1">管理站点的名称、Logo 及全局视觉风格</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#00ff88] text-black font-black rounded-full hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? '保存中...' : '保存更改'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 text-[#00ff88]">
            <Palette size={20} />
            <h3 className="font-bold">基本信息</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">站点名称</label>
              <input
                type="text"
                value={config.siteName}
                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">底部版权文本</label>
              <textarea
                value={config.footerText}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] outline-none transition-colors h-24"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 text-[#00ff88]">
            <ImageIcon size={20} />
            <h3 className="font-bold">Logo & 主题色</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Logo URL</label>
              <input
                type="text"
                value={config.logoUrl || ''}
                onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">品牌主题色</label>
              <div className="flex gap-4">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
