'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        const role = data.data?.user?.role;
        if (role !== 'ADMIN') {
          setError('您没有管理员权限');
          return;
        }
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || '登录失败');
      }
    } catch (e) {
      setError('连接服务器失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-bg-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 md:p-10 border-red-500/20"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">后台管理系统</h1>
          <p className="text-zinc-500 text-sm">请输入管理员凭据以继续</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 ml-1">
              管理员邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-10 focus:border-red-500/50"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500 ml-1">
              管理密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-10 focus:border-red-500/50"
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
            className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? '验证中...' : '进入后台'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
          >
            返回主站
          </button>
        </div>
      </motion.div>
    </div>
  );
}
