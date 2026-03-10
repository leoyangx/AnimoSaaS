'use client';

import { useState, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmColors = {
    danger: 'bg-red-500 hover:bg-red-400 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-400 text-black',
    default: 'bg-brand-primary hover:bg-brand-primary/90 text-black',
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4 mb-4">
          {variant === 'danger' && (
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-zinc-400 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 font-bold rounded-lg text-sm transition-colors ${confirmColors[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * useConfirm hook - 替代 window.confirm
 */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'default';
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'default',
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (
      title: string,
      message: string,
      variant: 'danger' | 'warning' | 'default' = 'default'
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setState({ open: true, title, message, variant });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
  }, []);

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      variant={state.variant}
      confirmLabel={state.variant === 'danger' ? '确认删除' : '确认'}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, dialog };
}
