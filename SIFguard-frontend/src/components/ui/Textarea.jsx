import React from 'react';

export default function Textarea({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  disabled = false,
  error,
  helperText,
  showCount = false,
  maxLength,
  id,
  className = '',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const charCount = value ? value.length : 0;
  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label}
          </label>
          {showCount && (
            <span className="text-[11px] font-mono text-slate-400">
              {charCount}
              {maxLength ? ` / ${maxLength}` : ''} chars · {wordCount} words
            </span>
          )}
        </div>
      )}

      <textarea
        id={inputId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm border rounded-lg p-3 transition-colors duration-150 outline-none resize-y ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed resize-none'
            : error
            ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-600'
            : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
        } ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
