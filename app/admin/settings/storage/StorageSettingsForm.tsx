'use client';

import { useState } from 'react';
import { HardDrive, Save, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function StorageSettingsForm({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新失败');
      }

      toast.success('存储引擎设置已更新');
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
          <h1 className="text-3xl font-display font-black tracking-tighter text-white">存储引擎</h1>
          <p className="text-zinc-500 text-sm mt-1">配置素材的底层存储服务，支持 AList、S3 及本地存储</p>
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
            <HardDrive size={20} />
            <h3 className="font-bold">存储提供商</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">当前引擎</label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] outline-none transition-colors appearance-none"
              >
                <option value="LOCAL">本地存储 (Local Server)</option>
                <option value="ALIST">AList 聚合存储 (推荐)</option>
                <option value="S3">Amazon S3 / 兼容服务</option>
              </select>
            </div>
          </div>
        </div>

        {config.provider === 'ALIST' && (
          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-3 text-[#00ff88]">
              <LinkIcon size={20} />
              <h3 className="font-bold">AList 配置</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">API 地址</label>
                <input
                  type="text"
                  value={config.config.alistUrl || ''}
                  onChange={(e) => setConfig({ ...config, config: { ...config.config, alistUrl: e.target.value } })}
                  placeholder="https://alist.example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">API 令牌 (Token)</label>
                <input
                  type="password"
                  value={config.config.alistToken || ''}
                  onChange={(e) => setConfig({ ...config, config: { ...config.config, alistToken: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">根目录路径</label>
                <input
                  type="text"
                  value={config.config.alistRoot || '/'}
                  onChange={(e) => setConfig({ ...config, config: { ...config.config, alistRoot: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
