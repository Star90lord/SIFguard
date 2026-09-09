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
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 select-none whitespace-nowrap';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-[15px] gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-xs border border-slate-900/10 focus-visible:outline-slate-900',
    secondary:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shadow-2xs focus-visible:outline-slate-700',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:outline-slate-600',
    danger:
      'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 shadow-xs focus-visible:outline-red-700',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        disabled || loading ? disabledStyles : ''
      } ${className}`}
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
