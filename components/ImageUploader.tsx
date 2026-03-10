'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

type InputMode = 'upload' | 'url';

export function ImageUploader({
  value,
  onChange,
  placeholder = '点击或拖拽图片到此处上传',
  className,
}: ImageUploaderProps) {
  const [mode, setMode] = useState<InputMode>(
    value && (value.startsWith('http://') || value.startsWith('https://')) ? 'url' : 'upload'
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
        setUrlInput(data.url);
      } else {
        setError(data.error || '上传失败');
      }
    } catch {
      setError('网络错误，上传失败');
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // 重置 input 以允许重复选择同一文件
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleUrlConfirm = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setError('');
  };

  const hasPreview = value && value.length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* 模式切换 */}
      <div className="flex items-center gap-1 p-0.5 bg-white/5 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors',
            mode === 'upload'
              ? 'bg-brand-primary/20 text-brand-primary'
              : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          <Upload size={12} />
          本地上传
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors',
            mode === 'url'
              ? 'bg-brand-primary/20 text-brand-primary'
              : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          <LinkIcon size={12} />
          URL 链接
        </button>
      </div>

      {mode === 'upload' ? (
        /* 上传区域 */
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative w-full rounded-xl border-2 border-dashed transition-all cursor-pointer',
            dragOver
              ? 'border-brand-primary bg-brand-primary/5'
              : 'border-white/10 hover:border-white/20 bg-white/[0.02]',
            uploading && 'cursor-not-allowed opacity-60',
            hasPreview ? 'aspect-video' : 'py-8'
          )}
        >
          {hasPreview ? (
            /* 有预览图 */
            <>
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-bold text-white hover:bg-white/30 transition-colors"
                >
                  更换图片
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-lg text-xs font-bold text-red-300 hover:bg-red-500/30 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </>
          ) : (
            /* 空状态 */
            <div className="flex flex-col items-center gap-3 text-zinc-500">
              {uploading ? (
                <>
                  <Loader2 size={28} className="animate-spin text-brand-primary" />
                  <span className="text-xs font-bold">上传中...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={28} />
                  <span className="text-xs font-bold">{placeholder}</span>
                  <span className="text-[10px] text-zinc-600">
                    支持 JPG / PNG / WEBP / GIF，最大 5MB
                  </span>
                </>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </div>
      ) : (
        /* URL 输入 */
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setError('');
              }}
              onBlur={handleUrlConfirm}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlConfirm()}
              className="flex-1 glass-input"
              placeholder="https://example.com/preview.jpg"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-400 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {hasPreview && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) && (
            <div className="w-full aspect-video rounded-xl bg-white/5 border border-dashed border-white/10 overflow-hidden relative">
              <img
                src={value}
                className="w-full h-full object-cover"
                alt="Preview"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-red-400 font-bold">{error}</p>
      )}
    </div>
  );
}
