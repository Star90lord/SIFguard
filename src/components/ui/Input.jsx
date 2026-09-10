import React from 'react';

export default function Input({
  label,
  icon: Icon,
  prefixIcon: PrefixIcon,
  suffixIcon: SuffixIcon,
  error,
  helperText,
  id,
  className = '',
  ...props
}) {
  const LeadingIcon = PrefixIcon || Icon;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {LeadingIcon && (
          <div className="absolute left-3 pointer-events-none text-slate-400 flex items-center justify-center">
            <LeadingIcon size={16} />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-white dark:bg-[#070B12] text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] text-sm border rounded-lg transition-colors duration-150 py-2 ${
            LeadingIcon ? 'pl-9 pr-3.5' : 'px-3.5'
          } ${
            error
              ? 'border-red-300 dark:border-red-700 focus:border-red-600 focus:ring-1 focus:ring-red-600'
              : 'border-[#D1D5DB] dark:border-[#263244] hover:border-slate-400 dark:hover:border-[#3B82F6] focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
          } outline-none ${className}`}
          {...props}
        />
        {SuffixIcon && (
          <div className="absolute right-3 pointer-events-none text-slate-400 flex items-center justify-center">
            <SuffixIcon size={16} />
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
