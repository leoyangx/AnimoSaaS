'use client';

import { useState } from 'react';
import { Shield, Save, UserPlus, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function SecuritySettingsForm({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新失败');
      }

      toast.success('安全策略已更新');
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
          <h1 className="text-3xl font-display font-black tracking-tighter text-white">安全策略</h1>
          <p className="text-zinc-500 text-sm mt-1">管理用户注册、访问权限及管理员安全设置</p>
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
            <UserPlus size={20} />
            <h3 className="font-bold">注册设置</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="text-sm font-bold text-white">开放注册</p>
                <p className="text-xs text-zinc-500">允许新用户自行注册账号</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, allowRegistration: !config.allowRegistration })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  config.allowRegistration ? "bg-[#00ff88]" : "bg-zinc-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  config.allowRegistration ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="text-sm font-bold text-white">邀请制模式</p>
                <p className="text-xs text-zinc-500">注册时必须提供有效的邀请码</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, requireInvitation: !config.requireInvitation })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  config.requireInvitation ? "bg-[#00ff88]" : "bg-zinc-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  config.requireInvitation ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 text-[#00ff88]">
            <Mail size={20} />
            <h3 className="font-bold">管理员通知</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">管理员邮箱</label>
              <input
                type="email"
                value={config.adminEmail || ''}
                onChange={(e) => setConfig({ ...config, adminEmail: e.target.value })}
                placeholder="admin@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00ff88] outline-none transition-colors"
              />
              <p className="text-[10px] text-zinc-500">用于接收系统告警和重要通知</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
