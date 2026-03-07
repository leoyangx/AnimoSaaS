'use client';

import { Package, Users, Key, Database, Search, AlertCircle, FolderOpen } from 'lucide-react';

type EmptyIcon = 'package' | 'users' | 'key' | 'database' | 'search' | 'alert' | 'folder';

const iconMap: Record<EmptyIcon, any> = {
  package: Package,
  users: Users,
  key: Key,
  database: Database,
  search: Search,
  alert: AlertCircle,
  folder: FolderOpen,
};

interface EmptyStateProps {
  icon?: EmptyIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = 'package', title, description, action }: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4">
        <Icon size={28} className="text-zinc-600" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-zinc-500 text-center max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-5 py-2 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold rounded-lg text-sm transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
