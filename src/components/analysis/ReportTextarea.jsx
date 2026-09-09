import React from 'react';

export default function ReportTextarea({ value, onChange, placeholder, disabled = false }) {
  const charCount = value ? value.length : 0;
  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border border-slate-300 bg-white shadow-2xs focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 transition-all">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Paste the safety report here...'}
          rows={11}
          disabled={disabled}
          aria-label="Safety report text"
          className="w-full px-5 py-4 text-[14px] leading-relaxed text-slate-900 placeholder:text-slate-400 bg-transparent border-none outline-none resize-y rounded-xl font-normal min-h-[220px]"
        />
      </div>

      {/* Metadata bar */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-mono">
        <span>Format: Raw Narrative / Field Log</span>
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount.toLocaleString()} characters</span>
        </div>
      </div>
    </div>
  );
}
