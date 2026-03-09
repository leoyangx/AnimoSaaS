'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw, Trash2, RotateCcw, UserPlus, Edit2, X } from 'lucide-react';
import Link from 'next/link';

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  domain: string | null;
  settings: any;
  createdAt: string;
  updatedAt: string;
  counts: {
    users: number;
    assets: number;
    downloadLogs: number;
    invitationCodes: number;
    apiKeys: number;
  };
  quota: {
    maxUsers: number;
    maxAssets: number;
    maxStorage: number;
    usedUsers: number;
    usedAssets: number;
    usedStorage: number;
  } | null;
  admins: {
    id: string;
    email: string;
    disabled?: boolean;
    lastLogin: string | null;
    createdAt: string;
  }[];
  recentLogs: {
    id: string;
    action: string;
    adminEmail: string;
    details: string | null;
    createdAt: string;
  }[];
}

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string>('');
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    name: '',
    plan: 'free',
    status: 'active',
    domain: '',
    maxUsers: 10,
    maxAssets: 100,
    maxStorage: 1073741824,
  });

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState<string | null>(null);
  const [editAdminForm, setEditAdminForm] = useState({ email: '', password: '', disabled: false });
  const [updatingAdmin, setUpdatingAdmin] = useState(false);

  useEffect(() => {
    params.then((p) => setTenantId(p.id));
  }, [params]);

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`);
      const data = await res.json();
      if (data.success) {
        setTenant(data.data);
        setForm({
          name: data.data.name,
          plan: data.data.plan,
          status: data.data.status,
          domain: data.data.domain || '',
          maxUsers: data.data.quota?.maxUsers ?? 10,
          maxAssets: data.data.quota?.maxAssets ?? 100,
          maxStorage: data.data.quota?.maxStorage ?? 1073741824,
        });
      }
    } catch (e) {
      console.error('Failed to fetch tenant', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) fetchTenant();
  }, [tenantId, fetchTenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || '保存成功' });
        fetchTenant();
      } else {
        setMessage({ type: 'error', text: data.error || '保存失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateQuota = async () => {
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recalculateQuota: true }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '配额已重新计算' });
        fetchTenant();
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除此租户吗？此操作将停用该租户。')) return;
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        router.push('/superadmin/tenants');
      } else {
        setMessage({ type: 'error', text: data.error || '删除失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAdmin(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || '管理员创建成功' });
        setAdminForm({ email: '', password: '' });
        setShowAddAdmin(false);
        fetchTenant();
      } else {
        // Show specific field errors from Zod validation if available
        const errorText = data.errors
          ? data.errors.map((e: { field: string; message: string }) => e.message).join('；')
          : data.error || '创建失败';
        setMessage({ type: 'error', text: errorText });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleEditAdmin = (admin: { id: string; email: string; disabled?: boolean }) => {
    setEditingAdmin(admin.id);
    setEditAdminForm({ email: admin.email, password: '', disabled: admin.disabled || false });
  };

  const handleUpdateAdmin = async (adminId: string) => {
    setUpdatingAdmin(true);
    setMessage({ type: '', text: '' });
    try {
      const updateData: any = {};
      if (editAdminForm.email) updateData.email = editAdminForm.email;
      if (editAdminForm.password) updateData.password = editAdminForm.password;
      updateData.disabled = editAdminForm.disabled;

      const res = await fetch(`/api/superadmin/tenants/${tenantId}/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || '管理员更新成功' });
        setEditingAdmin(null);
        fetchTenant();
      } else {
        const errorText = data.errors
          ? data.errors.map((e: { field: string; message: string }) => e.message).join('；')
          : data.error || '更新失败';
        setMessage({ type: 'error', text: errorText });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setUpdatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, email: string) => {
    if (!confirm(`确定要删除管理员 ${email} 吗？`)) return;
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/admins/${adminId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || '管理员删除成功' });
        fetchTenant();
      } else {
        setMessage({ type: 'error', text: data.error || '删除失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-10 text-center text-zinc-500">加载中...</div>;
  }

  if (!tenant) {
    return <div className="max-w-4xl mx-auto p-10 text-center text-zinc-500">租户不存在</div>;
  }

  const quotaPercent = (used: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/superadmin/tenants"
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
            <p className="text-zinc-500 text-sm font-mono">{tenant.slug}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {tenant.slug !== 'default' && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
              删除租户
            </button>
          )}
        </div>
      </div>

      {/* Message */}
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

      {/* Quota Overview */}
      {tenant.quota && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">配额使用</h2>
            <button
              onClick={handleRecalculateQuota}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <RotateCcw size={12} />
              重新计算
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Users */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">用户</span>
                <span className="text-white">
                  {tenant.quota.usedUsers} / {tenant.quota.maxUsers}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${quotaPercent(tenant.quota.usedUsers, tenant.quota.maxUsers)}%`,
                  }}
                />
              </div>
            </div>
            {/* Assets */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">资产</span>
                <span className="text-white">
                  {tenant.quota.usedAssets} / {tenant.quota.maxAssets}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{
                    width: `${quotaPercent(tenant.quota.usedAssets, tenant.quota.maxAssets)}%`,
                  }}
                />
              </div>
            </div>
            {/* Storage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">存储</span>
                <span className="text-white">
                  {formatBytes(tenant.quota.usedStorage)} / {formatBytes(tenant.quota.maxStorage)}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{
                    width: `${quotaPercent(tenant.quota.usedStorage, tenant.quota.maxStorage)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">租户信息</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">租户名称</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">标识符 (slug)</label>
              <input
                value={tenant.slug}
                disabled
                className="w-full px-3 py-2 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-zinc-500 text-sm font-mono cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">套餐</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
              >
                <option value="free">免费版</option>
                <option value="pro">专业版</option>
                <option value="enterprise">企业版</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">状态</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
              >
                <option value="active">活跃</option>
                <option value="suspended">停用</option>
                <option value="deleted">已删除</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">自定义域名</label>
              <input
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                placeholder="assets.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">最大用户数</label>
              <input
                type="number"
                value={form.maxUsers}
                onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">最大资产数</label>
              <input
                type="number"
                value={form.maxAssets}
                onChange={(e) => setForm({ ...form, maxAssets: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">最大存储空间</label>
              <select
                value={form.maxStorage}
                onChange={(e) => setForm({ ...form, maxStorage: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
              >
                <option value={1073741824}>1 GB</option>
                <option value={5368709120}>5 GB</option>
                <option value={10737418240}>10 GB</option>
                <option value={53687091200}>50 GB</option>
                <option value={107374182400}>100 GB</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '用户', value: tenant.counts.users },
          { label: '资产', value: tenant.counts.assets },
          { label: '下载记录', value: tenant.counts.downloadLogs },
          { label: '邀请码', value: tenant.counts.invitationCodes },
          { label: 'API 密钥', value: tenant.counts.apiKeys },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center"
          >
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Admins */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">管理员</h2>
          <button
            onClick={() => setShowAddAdmin(!showAddAdmin)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors font-medium"
          >
            <UserPlus size={12} />
            添加管理员
          </button>
        </div>
        {showAddAdmin && (
          <form onSubmit={handleCreateAdmin} className="p-5 border-b border-zinc-800 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">邮箱 *</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">密码 *</label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                  placeholder="至少8位，含大小写字母和数字"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowAddAdmin(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={creatingAdmin}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
              >
                {creatingAdmin ? '创建中...' : '确认创建'}
              </button>
            </div>
          </form>
        )}
        <div className="divide-y divide-zinc-800">
          {tenant.admins.map((admin) => (
            <div key={admin.id}>
              {editingAdmin === admin.id ? (
                <div className="p-4 space-y-3 bg-zinc-800/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">邮箱</label>
                      <input
                        type="email"
                        value={editAdminForm.email}
                        onChange={(e) =>
                          setEditAdminForm({ ...editAdminForm, email: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        新密码（留空不修改）
                      </label>
                      <input
                        type="password"
                        value={editAdminForm.password}
                        onChange={(e) =>
                          setEditAdminForm({ ...editAdminForm, password: e.target.value })
                        }
                        placeholder="至少8位，含大小写字母和数字"
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAdminForm.disabled}
                        onChange={(e) =>
                          setEditAdminForm({ ...editAdminForm, disabled: e.target.checked })
                        }
                        className="rounded border-zinc-700 bg-zinc-800"
                      />
                      禁用账号
                    </label>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingAdmin(null)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleUpdateAdmin(admin.id)}
                      disabled={updatingAdmin}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
                    >
                      {updatingAdmin ? '保存中...' : '保存修改'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{admin.email}</p>
                      {admin.disabled && (
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded">
                          已禁用
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">创建于 {formatDate(admin.createdAt)}</p>
                    <p className="text-xs text-zinc-500">
                      {admin.lastLogin ? `最后登录 ${formatDate(admin.lastLogin)}` : '从未登录'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditAdmin(admin)}
                      className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {tenant.admins.length === 0 && (
            <div className="p-6 text-center text-zinc-500 text-sm">暂无管理员</div>
          )}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <div className="p-5 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">最近操作日志</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {tenant.recentLogs.map((log) => (
            <div key={log.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-mono text-zinc-400">
                    {log.action}
                  </span>
                  <span className="text-sm text-zinc-300">{log.adminEmail}</span>
                </div>
                <span className="text-xs text-zinc-500">{formatDate(log.createdAt)}</span>
              </div>
              {log.details && <p className="text-xs text-zinc-500 mt-1 pl-1">{log.details}</p>}
            </div>
          ))}
          {tenant.recentLogs.length === 0 && (
            <div className="p-6 text-center text-zinc-500 text-sm">暂无操作日志</div>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <div className="text-xs text-zinc-600 flex gap-6">
        <span>ID: {tenant.id}</span>
        <span>创建于: {formatDate(tenant.createdAt)}</span>
        <span>更新于: {formatDate(tenant.updatedAt)}</span>
      </div>
    </div>
  );
}
