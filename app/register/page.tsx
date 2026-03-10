'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Key, UserPlus, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [config, setConfig] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch registration config
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendVerificationCode = async () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setCodeSent(true);
        setCountdown(60);
        setError('');
      } else {
        setError(data.error || '发送失败');
      }
    } catch (e) {
      setError('连接服务器失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = { email, password };

      // Add invitation code if required
      if (!config?.emailVerificationEnabled) {
        payload.invitationCode = invitationCode;
      } else {
        payload.verificationCode = verificationCode;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || '注册失败');
      }
    } catch (e) {
      setError('连接服务器失败');
    } finally {
      setLoading(false);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  const isEmailVerification = config.emailVerificationEnabled;

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card p-8 md:p-10"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-brand-secondary/20 text-brand-secondary flex items-center justify-center mx-auto mb-4 border border-brand-secondary/30">
            <UserPlus size={28} />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">
            {isEmailVerification ? '邮箱注册' : '学员注册'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {isEmailVerification ? '请使用邮箱验证码注册账号' : '请输入您的邀请码以激活账号'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isEmailVerification && (
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 ml-1">
                邀请码 (必填)
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  required
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  className="w-full glass-input pl-12 border-brand-secondary/30 focus:border-brand-secondary"
                  placeholder="ANIMO-XXXX"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 ml-1">
              电子邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-12"
                placeholder="name@example.com"
              />
            </div>
          </div>

          {isEmailVerification && (
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 ml-1">
                邮箱验证码
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full glass-input pl-12"
                    placeholder="输入验证码"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={sendingCode || countdown > 0}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border border-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                  {sendingCode ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : countdown > 0 ? (
                    `${countdown}s`
                  ) : codeSent ? (
                    '重新发送'
                  ) : (
                    '发送验证码'
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 ml-1">
              设置密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-12"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2 px-4 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full cyber-button flex items-center justify-center gap-2 group"
            style={{ background: 'linear-gradient(135deg, #00ddeb 0%, #00ff88 100%)' }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                注册中...
              </>
            ) : (
              <>
                立即注册
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-zinc-500 text-sm">
            已有账号？{' '}
            <Link href="/login" className="text-brand-secondary hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
