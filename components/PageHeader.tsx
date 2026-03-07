import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, backHref, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link href={backHref} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <ArrowLeft size={20} className="text-zinc-400" />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && <p className="text-zinc-500 mt-1 text-sm">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
