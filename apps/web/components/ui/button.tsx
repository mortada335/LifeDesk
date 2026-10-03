import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-sm shadow-indigo-500/25 focus-visible:ring-indigo-500 border border-indigo-700/20',
      gradient:
        'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 shadow-md shadow-indigo-500/20 focus-visible:ring-indigo-500 border border-indigo-400/30',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200/90 active:bg-slate-200 focus-visible:ring-slate-300 border border-slate-200/70',
      outline:
        'border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:ring-indigo-500 shadow-2xs',
      danger:
        'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 focus-visible:ring-rose-500 shadow-sm shadow-rose-500/25 border border-rose-700/20',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 hover:text-slate-900 focus-visible:ring-slate-200',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-8 gap-1.5 rounded-xl',
      md: 'text-xs sm:text-sm px-4 py-2 h-10 gap-2 rounded-xl',
      lg: 'text-sm sm:text-base px-5 py-2.5 h-11 gap-2.5 rounded-2xl font-bold',
      'icon-sm': 'w-8 h-8 p-0 rounded-xl shrink-0',
      'icon-md': 'w-10 h-10 p-0 rounded-xl shrink-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin me-2 h-4 w-4 shrink-0 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
