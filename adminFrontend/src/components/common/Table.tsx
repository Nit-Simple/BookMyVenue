import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { SortDir } from '@/hooks/useTable';
import { cn } from '@/utils/cn';

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({
  children,
  sortable,
  active,
  dir,
  onSort,
  align = 'left',
  className,
}: {
  children: React.ReactNode;
  sortable?: boolean;
  active?: boolean;
  dir?: SortDir;
  onSort?: () => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
        alignCls,
        className,
      )}
    >
      {sortable ? (
        <button
          onClick={onSort}
          className={cn(
            'inline-flex items-center gap-1 transition-colors hover:text-slate-700',
            align === 'right' && 'flex-row-reverse',
          )}
        >
          {children}
          {active ? (
            dir === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td className={cn('whitespace-nowrap px-4 py-3 text-slate-700', alignCls, className)}>
      {children}
    </td>
  );
}
