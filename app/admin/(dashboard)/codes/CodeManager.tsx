'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Plus, Download, Trash2, CheckCircle2, Clock, Loader2, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function CodeManager({ initialCodes }: { initialCodes: any[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const router = useRouter();

  const generateCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: generateCount }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCodes(data.data);
        router.refresh();
        setIsModalOpen(false);
        alert(`✅ 成功生成 ${generateCount} 个邀请码！`);
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

  const toggleSelectCode = (code: string) => {
    setSelectedCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCodes.length === codes.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(codes.map((c: any) => c.code));
    }
  };

  const batchDelete = async () => {
    if (selectedCodes.length === 0) {
      alert('请先选择要删除的邀请码');
      return;
    }
    if (!confirm(`确定要删除选中的 ${selectedCodes.length} 个邀请码吗？`)) return;

    setLoading(true);
    try {
      const deletePromises = selectedCodes.map(code =>
        fetch(`/api/admin/codes/${code}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      setCodes(codes.filter((c: any) => !selectedCodes.includes(c.code)));
      setSelectedCodes([]);
      router.refresh();
      alert(`✅ 成功删除 ${selectedCodes.length} 个邀请码`);
    } catch (error) {
      alert('❌ 批量删除失败，请重试');
    } finally {
      setLoading(false);
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
          {selectedCodes.length > 0 && (
            <button
              onClick={batchDelete}
              disabled={loading}
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={16} />
              删除选中 ({selectedCodes.length})
            </button>
          )}
          <button
            onClick={exportCodes}
            className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Download size={16} />
            导出 TXT
          </button>
          <button
            onClick={() => {
              setGenerateCount(1);
              setIsModalOpen(true);
            }}
            className="cyber-button text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            批量生成
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
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedCodes.length === codes.length && codes.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-white/10 bg-zinc-900 text-brand-primary focus:ring-brand-primary cursor-pointer"
                  />
                </th>
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
                    <input
                      type="checkbox"
                      checked={selectedCodes.includes(code.code)}
                      onChange={() => toggleSelectCode(code.code)}
                      className="w-4 h-4 rounded border-white/10 bg-zinc-900 text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                  </td>
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

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-bg-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">批量生成邀请码</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    生成数量
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-full glass-input"
                    placeholder="输入生成数量（1-100）"
                  />
                  <p className="text-xs text-zinc-600">
                    建议每次生成 1-50 个邀请码，最多支持 100 个
                  </p>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    disabled={loading}
                    onClick={generateCodes}
                    className="cyber-button text-sm flex items-center gap-2 min-w-[120px] justify-center"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <Plus size={16} />
                        生成 {generateCount} 个
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
