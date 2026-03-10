'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Database, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function StorageForm({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setMessage('✅ 存储配置保存成功！');
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(`❌ 保存失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      setMessage('❌ 网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-text-primary">
            存储引擎
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            配置 AList、123云盘等第三方存储服务，实现素材的自动化解析与下载。
          </p>
        </div>
        <div className="flex items-center gap-4">
          {message && (
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'text-sm font-bold',
                message.includes('✅') ? 'text-brand-primary' : 'text-red-400'
              )}
            >
              {message}
            </motion.span>
          )}
          <button
            disabled={loading}
            onClick={handleSave}
            className="cyber-button text-sm flex items-center gap-2 px-8"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            保存存储设置
          </button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* AList Config */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Database size={16} />
              </div>
              <h3 className="font-bold text-text-primary">AList 存储引擎</h3>
            </div>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch('/api/admin/test-storage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      provider: 'alist',
                      config: {
                        alistUrl: config.alistUrl,
                        alistToken: config.alistToken
                      }
                    }),
                  });
                  const data = await res.json();
                  alert(data.success ? '✅ 连接成功' : `❌ 连接失败: ${data.error}`);
                } finally {
                  setLoading(false);
                }
              }}
              className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors"
            >
              测试连接
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                AList 地址
              </label>
              <input
                type="text"
                value={config.alistUrl || ''}
                onChange={(e) => setConfig({ ...config, alistUrl: e.target.value })}
                className="w-full glass-input"
                placeholder="http://your-alist.com:5244"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                API Token
              </label>
              <input
                type="password"
                value={config.alistToken || ''}
                onChange={(e) => setConfig({ ...config, alistToken: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>
        </div>

        {/* 123Pan Config */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Database size={16} />
            </div>
            <h3 className="font-bold text-text-primary">123云盘</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                AccessToken
              </label>
              <input
                type="password"
                value={config.pan123Token || ''}
                onChange={(e) => setConfig({ ...config, pan123Token: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                挂载根目录
              </label>
              <input
                type="text"
                value={config.pan123Root || '/'}
                onChange={(e) => setConfig({ ...config, pan123Root: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>
        </div>

        {/* Juhe Config */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Database size={16} />
            </div>
            <h3 className="font-bold text-text-primary">聚合网盘解析</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                解析接口地址
              </label>
              <input
                type="text"
                value={config.juheUrl || ''}
                onChange={(e) => setConfig({ ...config, juheUrl: e.target.value })}
                className="w-full glass-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                API Key / Token
              </label>
              <input
                type="password"
                value={config.juheToken || ''}
                onChange={(e) => setConfig({ ...config, juheToken: e.target.value })}
                className="w-full glass-input"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
