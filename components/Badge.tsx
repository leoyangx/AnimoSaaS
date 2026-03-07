'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
}

const variantClasses = {
  success: 'bg-green-500/10 text-green-500 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  danger: 'bg-red-500/10 text-red-500 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  default: 'bg-zinc-800 text-zinc-400 border-zinc-700/50',
};

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-full border',
        variantClasses[variant],
        sizeClasses[size]
      )}
    >
      {children}
    </span>
  );
}

/**
 * 状态徽章快捷方式
 */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    active: { label: '活跃', variant: 'success' },
    suspended: { label: '已停用', variant: 'warning' },
    deleted: { label: '已删除', variant: 'danger' },
    unused: { label: '未使用', variant: 'default' },
    used: { label: '已使用', variant: 'info' },
    enabled: { label: '启用', variant: 'success' },
    disabled: { label: '禁用', variant: 'danger' },
  };

  const config = map[status] || { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * 套餐徽章
 */
export function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    free: { label: '免费版', variant: 'default' },
    pro: { label: '专业版', variant: 'info' },
    enterprise: { label: '企业版', variant: 'success' },
  };

  const config = map[plan] || { label: plan, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
