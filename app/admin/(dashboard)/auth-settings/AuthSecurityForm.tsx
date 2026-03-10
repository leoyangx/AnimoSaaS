'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Shield, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function AuthSecurityForm({ initialConfig }: { initialConfig: any }) {
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
        setMessage('✅ 安全配置保存成功！');
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
            安全与验证
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            管理用户注册权限、登录验证以及 SMTP 邮件服务设置。
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
            保存安全设置
          </button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 space-y-8"
      >
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-text-primary">访问控制策略</h3>
            <p className="text-xs text-text-secondary">定义新用户如何加入您的平台。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
              注册验证模式
            </label>
            <div className="flex items-center gap-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emailVerification"
                  checked={config.emailVerificationEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, emailVerificationEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-white/10 bg-zinc-900 text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="emailVerification" className="text-sm text-zinc-300 cursor-pointer">
                  开启邮箱验证
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
              邀请码验证
            </label>
            <div className="flex items-center gap-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="invitationOnly"
                  checked={true}
                  disabled
                  className="w-4 h-4 rounded border-white/10 bg-zinc-900 text-brand-primary focus:ring-brand-primary opacity-50"
                />
                <label
                  htmlFor="invitationOnly"
                  className="text-sm text-zinc-500 cursor-not-allowed"
                >
                  强制邀请码注册 (默认开启)
                </label>
              </div>
            </div>
          </div>
        </div>

        {config.emailVerificationEnabled && (
          <div className="space-y-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-400">SMTP 邮件服务器设置</h4>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch('/api/admin/test-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(config),
                    });
                    const data = await res.json();
                    alert(
                      data.success
                        ? '✅ 测试邮件发送成功，请检查收件箱'
                        : `❌ 发送失败: ${data.error}`
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors"
              >
                发送测试邮件
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                  SMTP 主机
                </label>
                <input
                  type="text"
                  value={config.smtpHost || ''}
                  onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                  className="w-full glass-input"
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                  SMTP 端口
                </label>
                <input
                  type="number"
                  value={config.smtpPort || 465}
                  onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                  className="w-full glass-input"
                  placeholder="465"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                  加密方式
                </label>
                <select
                  value={config.smtpEncryption || 'SSL'}
                  onChange={(e) => setConfig({ ...config, smtpEncryption: e.target.value })}
                  className="w-full glass-input bg-zinc-900"
                >
                  <option value="SSL">SSL (推荐)</option>
                  <option value="TLS">TLS</option>
                  <option value="STARTTLS">STARTTLS</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                  SMTP 用户名
                </label>
                <input
                  type="text"
                  value={config.smtpUser || ''}
                  onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                  className="w-full glass-input"
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                  SMTP 密码
                </label>
                <input
                  type="password"
                  value={config.smtpPass || ''}
                  onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                  className="w-full glass-input"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                  发件人地址
                </label>
                <input
                  type="email"
                  value={config.smtpFrom || ''}
                  onChange={(e) => setConfig({ ...config, smtpFrom: e.target.value })}
                  className="w-full glass-input"
                  placeholder="noreply@example.com"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                  邮件模板
                </label>
                <select
                  value={config.emailTemplate || 'default'}
                  onChange={(e) => setConfig({ ...config, emailTemplate: e.target.value })}
                  className="w-full glass-input bg-zinc-900"
                >
                  <option value="default">默认模板</option>
                  <option value="modern">现代风格</option>
                  <option value="minimal">简约风格</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={config.emailNotifications !== false}
                    onChange={(e) =>
                      setConfig({ ...config, emailNotifications: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-white/10 bg-zinc-900 text-brand-primary focus:ring-brand-primary"
                  />
                  <label
                    htmlFor="emailNotifications"
                    className="text-xs text-text-secondary cursor-pointer select-none"
                  >
                    <span className="font-bold text-text-primary">启用邮件提醒</span>
                    <p className="mt-0.5 opacity-60">
                      开启后，系统将在重要操作时发送邮件通知。
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
