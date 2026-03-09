'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Plus, Download, Trash2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function CodeManager({ initialCodes }: { initialCodes: any[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const generateCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 20 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCodes(data.data);
        router.refresh();
        alert('✅ 批量生成成功！');
      } else {
        alert(`❌ 生成失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      alert('❌ 网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const exportCodes = () => {
    // 导出为 TXT 格式（纯文本，每行一个邀请码）
    const codesText = codes.map((c: any) => c.code).join('\n');
    const blob = new Blob([codesText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `邀请码_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteCode = async (code: string) => {
    if (!confirm('确定要删除该邀请码吗？')) return;
    try {
      const res = await fetch(`/api/admin/codes/${code}`, { method: 'DELETE' });
      if (res.ok) {
        setCodes(codes.filter((c: any) => c.code !== code));
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete code:', error);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">邀请码管理</h1>
          <p className="text-zinc-500 text-sm">生成并分发邀请码，控制学员入驻。</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCodes}
            className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Download size={16} />
            导出 TXT
          </button>
          <button
            disabled={loading}
            onClick={generateCodes}
            className="cyber-button text-sm flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            批量生成 (20个)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">总计生成</div>
          <div className="text-3xl font-display font-bold">{codes.length}</div>
        </div>
        <div className="glass-card p-6">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">未使用</div>
          <div className="text-3xl font-display font-bold text-brand-primary">
            {codes.filter((c: any) => c.status === 'unused').length}
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">已使用</div>
          <div className="text-3xl font-display font-bold text-zinc-400">
            {codes.filter((c: any) => c.status === 'used').length}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  邀请码
                </th>
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  状态
                </th>
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  使用者 ID
                </th>
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  创建时间
                </th>
                <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code: any) => (
                <tr
                  key={code.code}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-brand-secondary">{code.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    {code.status === 'unused' ? (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-brand-primary">
                        <Clock size={12} /> 未使用
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
                        <CheckCircle2 size={12} /> 已使用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 font-mono">
                    {code.usedBy || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{formatDate(code.createdAt)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => deleteCode(code.code)}
                      className="text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
