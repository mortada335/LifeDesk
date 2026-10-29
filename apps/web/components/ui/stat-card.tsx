import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'red' | 'amber' | 'blue' | 'emerald' | 'slate';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'slate',
  onClick,
}: StatCardProps) {
  const colorMap = {
    red: {
      card: 'bg-white border-slate-200/90 hover:border-rose-300/80 hover:shadow-sm',
      iconBox: 'bg-rose-600 text-white shadow-sm',
      value: 'text-slate-900',
      accent: 'bg-rose-600',
    },
    amber: {
      card: 'bg-white border-slate-200/90 hover:border-amber-300/80 hover:shadow-sm',
      iconBox: 'bg-amber-500 text-white shadow-sm',
      value: 'text-slate-900',
      accent: 'bg-amber-500',
    },
    blue: {
      card: 'bg-white border-slate-200/90 hover:border-blue-300/80 hover:shadow-sm',
      iconBox: 'bg-blue-600 text-white shadow-sm',
      value: 'text-slate-900',
      accent: 'bg-blue-600',
    },
    emerald: {
      card: 'bg-white border-slate-200/90 hover:border-emerald-300/80 hover:shadow-sm',
      iconBox: 'bg-emerald-600 text-white shadow-sm',
      value: 'text-slate-900',
      accent: 'bg-emerald-600',
    },
    slate: {
      card: 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm',
      iconBox: 'bg-slate-900 text-white shadow-sm',
      value: 'text-slate-900',
      accent: 'bg-slate-900',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={clsx(
        'group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden backdrop-blur-sm shadow-xs',
        scheme.card,
        onClick && 'cursor-pointer hover:-translate-y-1 hover:shadow-lg',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', scheme.accent)} />
            {title}
          </p>
          <p className={clsx('text-2xl sm:text-3xl font-extrabold tracking-tight font-mono', scheme.value)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium pt-0.5 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
            scheme.iconBox,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
