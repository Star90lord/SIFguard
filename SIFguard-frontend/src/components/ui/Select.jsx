import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export default function Select({
  label,
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  disabled = false,
  size = 'md',
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

  // Normalize options to { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value, label: opt.label || String(opt.value) };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (value && value !== 'ALL' ? value : placeholder);
  const hasValue = Boolean(value && value !== 'ALL');

  function handleSelect(optVal) {
    if (!onChange || disabled) return;
    // Pass value, supporting both (val) => ... and (e) => ...
    const eventLike = {
      target: { value: optVal },
      currentTarget: { value: optVal },
      value: optVal,
    };
    // If handler expects direct value:
    try {
      onChange(optVal);
    } catch {
      onChange(eventLike);
    }
    setIsOpen(false);
  }

  return (
    <div className={`relative inline-block text-left w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full inline-flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : hasValue
            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 cursor-pointer'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-left">{displayLabel}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {hasValue && !disabled ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('');
              }}
              className="p-0.5 hover:bg-white/20 rounded text-white/80 hover:text-white"
              title="Clear selection"
            >
              <X size={12} />
            </span>
          ) : (
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full min-w-48 rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-50 focus:outline-none ring-1 ring-black/5 animate-in fade-in duration-100">
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {normalizedOptions.map((opt, idx) => {
              const isSelected = String(value) === String(opt.value);
              return (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 transition-colors text-left ${
                    isSelected ? 'font-semibold text-slate-900 bg-slate-50/70' : 'text-slate-600'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
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
