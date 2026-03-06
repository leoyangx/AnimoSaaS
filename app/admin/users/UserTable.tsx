'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldOff,
  Trash2,
  Loader2,
  Key,
  Plus,
  X,
  Search,
  MoreVertical,
  Edit3,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  UserPlus,
  Mail,
  User,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function UserTable({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUserData, setNewUserData] = useState({ email: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : statusFilter === 'active' ? !user.disabled : user.disabled;
    return matchesSearch && matchesStatus;
  });

  const toggleStatus = async (id: string, currentDisabled: boolean) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !currentDisabled }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === id ? { ...u, disabled: !currentDisabled } : u)));
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('确定要删除该学员吗？此操作不可逆。')) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewUserData({ email: '', password: '' });
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || '添加失败');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        setIsPasswordModalOpen(false);
        setNewPassword('');
        alert('密码修改成功');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="搜索学员邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-12 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="glass-input bg-zinc-900 text-sm px-4 py-2"
          >
            <option value="all">所有状态</option>
            <option value="active">正常</option>
            <option value="disabled">已禁用</option>
          </select>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="cyber-button text-sm flex items-center gap-2"
        >
          <Plus size={16} />
          添加学员
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                学员信息
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                IP/城市
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                注册时间
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                最后登录
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                状态
              </th>
              <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500 text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  未找到匹配的学员。
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 text-brand-primary flex items-center justify-center text-sm font-bold border border-brand-primary/10">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white/90">{user.email}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          Student ID: {user.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-300 font-mono">{user.ip || '未知'}</span>
                      <span className="text-[10px] text-zinc-500">{user.city || '未知地点'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {user.lastLogin ? formatDate(user.lastLogin) : '从未登录'}
                  </td>
                  <td className="px-6 py-4">
                    {user.disabled ? (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                          已禁用
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                          正常
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        disabled={loadingId === user.id}
                        onClick={() => toggleStatus(user.id, user.disabled)}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                        title={user.disabled ? '启用' : '禁用'}
                      >
                        {loadingId === user.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : user.disabled ? (
                          <Shield size={16} />
                        ) : (
                          <ShieldOff size={16} />
                        )}
                      </button>
                      <button
                        disabled={loadingId === user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setIsPasswordModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-brand-secondary transition-colors disabled:opacity-50"
                        title="重置密码"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        disabled={loadingId === user.id}
                        onClick={() => deleteUser(user.id)}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="删除学员"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-bg-dark border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">添加新学员</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={addUser} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    学员邮箱
                  </label>
                  <input
                    required
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full glass-input"
                    placeholder="student@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    初始密码
                  </label>
                  <input
                    required
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full glass-input"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full cyber-button py-3 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : '确认添加'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-bg-dark border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">修改密码</h2>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-zinc-400">
                正在为 <span className="text-white font-mono">{selectedUser?.email}</span> 修改密码
              </p>
              <form onSubmit={changePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    新密码
                  </label>
                  <input
                    required
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full glass-input"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full cyber-button py-3 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : '确认修改'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
