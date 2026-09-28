import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 select-none whitespace-nowrap active:scale-[0.99]';

  const sizeStyles = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-9 px-4 text-sm sm:text-[15px] gap-2',
    lg: 'h-10 px-5 text-[15px] sm:text-base gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-2xs border border-blue-700/20 focus-visible:outline-blue-600',
    secondary:
      'bg-white dark:bg-[#111827] text-slate-800 dark:text-[#F8FAFC] border border-[#D1D5DB] dark:border-[#263244] hover:bg-slate-50 hover:dark:bg-[#172033] hover:text-slate-950 hover:dark:text-white active:bg-slate-100 shadow-2xs focus-visible:outline-slate-700',
    ghost:
      'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:dark:bg-slate-800 hover:text-slate-900 hover:dark:text-white active:bg-slate-200 focus-visible:outline-slate-600',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-2xs border border-red-700/20 focus-visible:outline-red-600',
    outline:
      'bg-transparent text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-500 hover:bg-blue-50 hover:dark:bg-blue-950/40 active:bg-blue-100 focus-visible:outline-blue-600',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none active:scale-100';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${disabled || loading ? disabledStyles : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0 text-current" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
