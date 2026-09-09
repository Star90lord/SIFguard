import React from 'react';

export default function Input({
  label,
  icon: Icon,
  error,
  helperText,
  id,
  className = '',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-slate-400 flex items-center justify-center">
            <Icon size={16} />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm border rounded-lg transition-colors duration-150 py-2 ${
            Icon ? 'pl-9 pr-3.5' : 'px-3.5'
          } ${
            error
              ? 'border-red-300 focus:border-red-600 focus:ring-1 focus:ring-red-600'
              : 'border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
          } outline-none ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
