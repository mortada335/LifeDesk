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
      card: 'bg-gradient-to-br from-white via-rose-50/30 to-rose-100/40 border-rose-200/80 hover:border-rose-300 hover:shadow-rose-500/10',
      iconBox: 'bg-rose-500 text-white shadow-rose-500/20 shadow-md',
      value: 'text-rose-950',
      accent: 'bg-rose-500',
    },
    amber: {
      card: 'bg-gradient-to-br from-white via-amber-50/30 to-amber-100/40 border-amber-200/80 hover:border-amber-300 hover:shadow-amber-500/10',
      iconBox: 'bg-amber-500 text-white shadow-amber-500/20 shadow-md',
      value: 'text-amber-950',
      accent: 'bg-amber-500',
    },
    blue: {
      card: 'bg-gradient-to-br from-white via-sky-50/30 to-sky-100/40 border-sky-200/80 hover:border-sky-300 hover:shadow-sky-500/10',
      iconBox: 'bg-sky-500 text-white shadow-sky-500/20 shadow-md',
      value: 'text-sky-950',
      accent: 'bg-sky-500',
    },
    emerald: {
      card: 'bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/40 border-emerald-200/80 hover:border-emerald-300 hover:shadow-emerald-500/10',
      iconBox: 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-md',
      value: 'text-emerald-950',
      accent: 'bg-emerald-500',
    },
    indigo: {
      card: 'bg-gradient-to-br from-white via-indigo-50/30 to-indigo-100/40 border-indigo-200/80 hover:border-indigo-300 hover:shadow-indigo-500/10',
      iconBox: 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-md',
      value: 'text-indigo-950',
      accent: 'bg-indigo-600',
    },
    slate: {
      card: 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-slate-500/10',
      iconBox: 'bg-slate-800 text-white shadow-slate-500/20 shadow-md',
      value: 'text-slate-900',
      accent: 'bg-slate-600',
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
