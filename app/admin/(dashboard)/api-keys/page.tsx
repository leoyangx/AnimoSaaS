'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Copy, Check, Trash2, Power, PowerOff, Eye, EyeOff } from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface PermissionOption {
  key: string;
  description: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    permissions: [] as string[],
    expiresIn: 'never',
  });

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/api-keys');
      const data = await res.json();
      if (data.success) {
        setKeys(data.data.keys);
        setPermissions(data.data.availablePermissions);
      }
    } catch (e) {
      console.error('Failed to fetch API keys', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.permissions.length === 0) {
      setError('至少需要选择一个权限');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setNewKey(data.data.fullKey);
        setForm({ name: '', permissions: [], expiresIn: 'never' });
        fetchKeys();
      } else {
        setError(data.error || '创建失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchKeys();
    } catch (e) {
      console.error('Toggle failed', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此 API Key 吗？此操作不可撤销。')) return;
    try {
      await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' });
      fetchKeys();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePermission = (perm: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const permLabel = (perm: string) => {
    const [scope, action] = perm.split(':');
    const scopeMap: Record<string, string> = {
      assets: '资产',
      categories: '分类',
      users: '用户',
      download: '下载',
      logs: '日志',
    };
    const actionMap: Record<string, string> = {
      read: '读取',
      write: '写入',
      delete: '删除',
    };
    return `${scopeMap[scope] || scope}:${actionMap[action] || action}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">API Key 管理</h1>
          <p className="text-zinc-500 mt-1">管理外部 API 访问密钥</p>
        </div>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setNewKey(null);
          }}
          className="cyber-button text-sm flex items-center gap-2"
        >
          <Plus size={16} />
          创建 API Key
        </button>
      </div>

      {/* New Key Display */}
      {newKey && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-green-400" />
            <span className="text-sm font-bold text-green-400">API Key 已创建</span>
          </div>
          <p className="text-xs text-green-400/70 mb-3">
            请立即复制此密钥，关闭后将无法再次查看完整密钥。
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-black/30 rounded-lg text-green-300 text-sm font-mono break-all">
              {newKey}
            </code>
            <button
              onClick={() => copyToClipboard(newKey)}
              className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
            >
              {copied ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Copy size={16} className="text-green-400" />
              )}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 text-xs text-green-400/60 hover:text-green-400 transition-colors"
          >
            我已复制，关闭此提示
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && !newKey && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">创建新 API Key</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">名称 *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-brand-primary/50"
                placeholder="例如：移动端 App、第三方集成"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">权限范围 *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {permissions.map((perm) => (
                  <label
                    key={perm.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      form.permissions.includes(perm.key)
                        ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                        : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                      className="sr-only"
                    />
                    <span className="text-xs font-medium">{permLabel(perm.key)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">过期时间</label>
              <select
                value={form.expiresIn}
                onChange={(e) => setForm({ ...form, expiresIn: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-brand-primary/50"
              >
                <option value="never">永不过期</option>
                <option value="7d">7 天</option>
                <option value="30d">30 天</option>
                <option value="90d">90 天</option>
                <option value="365d">1 年</option>
              </select>
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
                className="px-6 py-2 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {creating ? '创建中...' : '确认创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* API Docs Hint */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-2">API 使用方式</h3>
        <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-zinc-400">
          <p className="text-zinc-500 mb-1"># 使用 API Key 访问资产列表</p>
          <p>
            curl -H &quot;Authorization: Bearer{' '}
            <span className="text-brand-primary">ak_your_key_here</span>&quot; \
          </p>
          <p className="pl-5">
            {'https://your-domain.com'}
            /api/v1/assets
          </p>
        </div>
        <div className="mt-3 text-xs text-zinc-500 space-y-1">
          <p>
            可用端点：<code className="text-zinc-400">GET /api/v1/assets</code>、
            <code className="text-zinc-400">GET /api/v1/assets/:id</code>、
            <code className="text-zinc-400">GET /api/v1/assets/:id/download</code>、
            <code className="text-zinc-400">GET /api/v1/categories</code>
          </p>
        </div>
      </div>

      {/* Key List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-xs font-medium text-zinc-500 p-4">名称</th>
              <th className="text-left text-xs font-medium text-zinc-500 p-4">密钥前缀</th>
              <th className="text-left text-xs font-medium text-zinc-500 p-4">权限</th>
              <th className="text-left text-xs font-medium text-zinc-500 p-4">最后使用</th>
              <th className="text-left text-xs font-medium text-zinc-500 p-4">状态</th>
              <th className="text-right text-xs font-medium text-zinc-500 p-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {keys.map((key) => (
              <tr key={key.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="p-4">
                  <p className="text-sm font-medium text-white">{key.name}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    创建于 {formatDate(key.createdAt)}
                    {key.expiresAt && ` · 过期 ${formatDate(key.expiresAt)}`}
                  </p>
                </td>
                <td className="p-4">
                  <code className="text-xs text-zinc-400 font-mono bg-zinc-800/50 px-2 py-0.5 rounded">
                    {key.keyPrefix}
                  </code>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {key.permissions.slice(0, 3).map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400 font-mono"
                      >
                        {p}
                      </span>
                    ))}
                    {key.permissions.length > 3 && (
                      <span className="text-[10px] text-zinc-500">
                        +{key.permissions.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-xs text-zinc-500">{formatDate(key.lastUsedAt)}</span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      key.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {key.isActive ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleToggle(key.id, key.isActive)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                      title={key.isActive ? '停用' : '启用'}
                    >
                      {key.isActive ? (
                        <PowerOff size={14} className="text-yellow-500" />
                      ) : (
                        <Power size={14} className="text-green-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="删除"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {keys.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-zinc-500 text-sm">
                  暂无 API Key，点击上方按钮创建
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
  );
}
