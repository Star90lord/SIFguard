import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export default function Select({
  label,
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasValue = Boolean(value);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
          hasValue
            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-slate-400 font-normal">
          {label}:
        </span>
        <span className="font-semibold">{hasValue ? value : placeholder}</span>
        {hasValue ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setIsOpen(false);
            }}
            className="p-0.5 hover:bg-white/20 rounded text-white/80 hover:text-white"
            title="Clear filter"
          >
            <X size={12} />
          </span>
        ) : (
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-40 focus:outline-none ring-1 ring-black/5 animate-in fade-in duration-100">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Filter by {label}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
          >
            <span className={!hasValue ? 'font-semibold text-slate-900' : ''}>All {label}s</span>
            {!hasValue && <Check size={13} className="text-slate-900" />}
          </button>
          <div className="max-h-56 overflow-y-auto">
            {options.map((option) => {
              const isSelected = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 transition-colors text-left ${
                    isSelected ? 'font-semibold text-slate-900 bg-slate-50/70' : 'text-slate-600'
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {isSelected && <Check size={13} className="text-slate-900 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
