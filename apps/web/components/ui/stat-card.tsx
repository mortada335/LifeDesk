import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'red' | 'amber' | 'blue' | 'emerald' | 'indigo' | 'slate';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  onClick,
}: StatCardProps) {
  const colorMap = {
    red: {
      bg: 'bg-rose-50/70 border-rose-100 hover:border-rose-300',
      iconBg: 'bg-rose-500/10 text-rose-600',
      value: 'text-rose-700',
    },
    amber: {
      bg: 'bg-amber-50/70 border-amber-100 hover:border-amber-300',
      iconBg: 'bg-amber-500/10 text-amber-600',
      value: 'text-amber-700',
    },
    blue: {
      bg: 'bg-blue-50/70 border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-500/10 text-blue-600',
      value: 'text-blue-700',
    },
    emerald: {
      bg: 'bg-emerald-50/70 border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      value: 'text-emerald-700',
    },
    indigo: {
      bg: 'bg-indigo-50/70 border-indigo-100 hover:border-indigo-300',
      iconBg: 'bg-indigo-500/10 text-indigo-600',
      value: 'text-indigo-700',
    },
    slate: {
      bg: 'bg-white border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-700',
      value: 'text-slate-900',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-5 rounded-2xl border transition-all duration-150 shadow-xs relative overflow-hidden',
        scheme.bg,
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className={clsx('text-2xl font-bold tracking-tight mt-1.5', scheme.value)}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={clsx('p-3 rounded-xl flex items-center justify-center shadow-xs', scheme.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
