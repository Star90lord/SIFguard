import React from 'react';
import { Upload, FileText, Sparkles } from 'lucide-react';

export default function AnalysisModeSwitch({ mode, onChange, className = '' }) {
  const modes = [
    { id: 'upload', label: 'Upload Files', icon: Upload },
    { id: 'paste', label: 'Paste Multiple Reports', icon: FileText },
    { id: 'sample', label: 'Sample Reports', icon: Sparkles },
  ];

  return (
    <div
      className={`inline-flex p-1 bg-slate-100/90 border border-slate-200/80 rounded-lg select-none ${className}`}
      role="tablist"
      aria-label="Input mode selection"
    >
      {modes.map((m) => {
        const isActive = mode === m.id;
        const Icon = m.icon;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(m.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
            }`}
          >
            <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
