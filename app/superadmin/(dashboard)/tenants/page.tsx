'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  domain: string | null;
  createdAt: string;
  userCount: number;
  assetCount: number;
  quota: {
    maxUsers: number;
    maxAssets: number;
    maxStorage: number;
    usedUsers: number;
    usedAssets: number;
    usedStorage: number;
  } | null;
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    plan: 'free',
    domain: '',
    maxUsers: 10,
    maxAssets: 100,
    maxStorage: 1073741824,
  });
  const [error, setError] = useState('');

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/tenants');
      const data = await res.json();
      if (data.success) {
        setTenants(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch tenants', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || '创建失败');
        return;
      }
      setShowCreate(false);
      setForm({
        name: '',
        slug: '',
        plan: 'free',
        domain: '',
        maxUsers: 10,
        maxAssets: 100,
        maxStorage: 1073741824,
      });
      fetchTenants();
    } catch (e) {
      setError('网络错误');
    } finally {
      setCreating(false);
    }
  };

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">租户管理</h1>
          <p className="text-zinc-500 mt-1">管理平台所有租户</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchTenants}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={`text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            创建租户
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">创建新租户</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">租户名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    // 自动生成 slug
                    if (
                      !form.slug ||
                      form.slug ===
                        form.name
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9-]/g, '')
                    ) {
                      setForm((f) => ({
                        ...f,
                        name: e.target.value,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9-]/g, ''),
                      }));
                    }
                  }}
                  required
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                  placeholder="我的组织"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  标识符 (slug) *
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                  pattern="^[a-z0-9-]+$"
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-amber-500/50"
                  placeholder="my-org"
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
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {creating ? '创建中...' : '确认创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          placeholder="搜索租户名称或标识符..."
        />
      </div>

      {/* Tenant List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="table-responsive">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-medium text-zinc-500 p-4">租户</th>
                <th className="text-left text-xs font-medium text-zinc-500 p-4">套餐</th>
                <th className="text-left text-xs font-medium text-zinc-500 p-4">用户</th>
                <th className="text-left text-xs font-medium text-zinc-500 p-4">资产</th>
                <th className="text-left text-xs font-medium text-zinc-500 p-4">状态</th>
                <th className="text-right text-xs font-medium text-zinc-500 p-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-xs">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{tenant.name}</p>
                        <p className="text-xs text-zinc-500 font-mono">{tenant.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium text-zinc-400 capitalize">
                      {tenant.plan === 'free'
                        ? '免费版'
                        : tenant.plan === 'pro'
                          ? '专业版'
                          : '企业版'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-white">{tenant.userCount}</span>
                    {tenant.quota && (
                      <span className="text-xs text-zinc-500">/{tenant.quota.maxUsers}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-white">{tenant.assetCount}</span>
                    {tenant.quota && (
                      <span className="text-xs text-zinc-500">/{tenant.quota.maxAssets}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tenant.status === 'active'
                          ? 'bg-green-500/10 text-green-500'
                          : tenant.status === 'suspended'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {tenant.status === 'active'
                        ? '活跃'
                        : tenant.status === 'suspended'
                          ? '已停用'
                          : '已删除'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/superadmin/tenants/${tenant.id}`}
                      className="text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors"
                    >
                      管理
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-500 text-sm">
                    {search ? '未找到匹配的租户' : '暂无租户'}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-500 text-sm">
                    加载中...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
