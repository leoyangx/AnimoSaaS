'use client';

import { useState, useEffect } from 'react';
import { Search, UserX, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  role: string;
  disabled: boolean;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  lastLogin: string | null;
  createdAt: string;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || '操作成功' });
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.tenantName.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '从未登录';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">用户管理</h1>
          <p className="text-zinc-500 text-sm">查看和管理所有租户的用户</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="搜索用户或租户..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 w-64"
          />
        </div>
      </div>

      {message.text && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  租户
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    加载中...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    暂无用户
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{user.email}</div>
                      <div className="text-xs text-zinc-500 font-mono">{user.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/superadmin/tenants/${user.tenantId}`}
                        className="text-sm text-amber-400 hover:text-amber-300"
                      >
                        {user.tenantName}
                      </Link>
                      <div className="text-xs text-zinc-500">/{user.tenantSlug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.disabled ? (
                        <span className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-400">
                          已禁用
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-400">
                          正常
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.disabled)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.disabled
                            ? 'text-green-400 hover:bg-green-500/10'
                            : 'text-red-400 hover:bg-red-500/10'
                        }`}
                        title={user.disabled ? '启用用户' : '禁用用户'}
                      >
                        {user.disabled ? <UserCheck size={16} /> : <UserX size={16} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
