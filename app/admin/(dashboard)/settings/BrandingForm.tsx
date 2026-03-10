'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Palette, Loader2, Upload, X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function BrandingForm({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('❌ 请上传图片文件');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage('❌ 图片大小不能超过 2MB');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setConfig({ ...config, logo: data.url });
        setMessage('✅ Logo 上传成功！');
      } else {
        const data = await res.json();
        setMessage(`❌ 上传失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      setMessage('❌ 上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setConfig({ ...config, logo: '' });
    setMessage('Logo 已移除，请保存以应用更改');
  };

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
        setMessage('✅ 品牌配置保存成功！');
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
            品牌与视觉
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            自定义您的品牌名称、标语、Logo 以及全局色彩风格。
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
            保存品牌设置
          </button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 space-y-8"
      >
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-text-primary">核心品牌信息</h3>
            <p className="text-xs text-text-secondary">这些信息将展示在前台页面的显著位置。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
              品牌 Logo
            </label>
            <div className="flex flex-col gap-4">
              {config.logo ? (
                <div className="relative w-full max-w-xs h-32 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden group">
                  <Image
                    src={config.logo}
                    alt="Logo"
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 100vw, 384px"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-xs h-32 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center">
                  <span className="text-xs text-zinc-500">暂无 Logo</span>
                </div>
              )}
              <div>
                <label
                  htmlFor="logo-upload"
                  className={cn(
                    'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all',
                    uploading
                      ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                      : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border border-brand-primary/20'
                  )}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {config.logo ? '更换 Logo' : '上传 Logo'}
                    </>
                  )}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  支持 PNG、JPG、SVG 格式，建议尺寸 200x200px，最大 2MB
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
              网站标题
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="w-full glass-input"
              placeholder="例如: AnimoSaaS"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
              网站 Slogan
            </label>
            <input
              type="text"
              value={config.slogan}
              onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
              className="w-full glass-input"
              placeholder="例如: 为创作者而生"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
              主色调 (Accent Color)
            </label>
            <div className="flex gap-3">
              <div
                className="h-12 w-12 rounded-xl border border-white/10 shadow-inner flex-shrink-0"
                style={{ backgroundColor: config.themeColor || '#10b981' }}
              />
              <input
                type="text"
                value={config.themeColor || '#10b981'}
                onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                className="flex-1 glass-input font-mono uppercase"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
              版权水印文字
            </label>
            <input
              type="text"
              value={config.watermark}
              onChange={(e) => setConfig({ ...config, watermark: e.target.value })}
              className="w-full glass-input"
              placeholder="例如: ANIMOSAAS"
            />
          </div>
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
              底部版权信息
            </label>
            <input
              type="text"
              value={config.footer}
              onChange={(e) => setConfig({ ...config, footer: e.target.value })}
              className="w-full glass-input"
              placeholder="© 2024 AnimoSaaS. All Rights Reserved."
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
