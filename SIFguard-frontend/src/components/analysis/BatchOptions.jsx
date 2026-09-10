import React from 'react';
import { Layers, GitMerge, Sliders } from 'lucide-react';

export default function BatchOptions({
  groupBySite = true,
  onToggleGroupBySite,
  autoMerge = true,
  onToggleAutoMerge,
  depth = 'standard',
  onChangeDepth,
  className = '',
}) {
  return (
    <div className={`p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 space-y-3.5 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
        <Sliders size={13} className="text-slate-500" />
        <span>Batch Configuration</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Group by site toggle */}
        <div className="flex items-start justify-between p-2.5 rounded-lg bg-white border border-slate-200/80">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <Layers size={13} className="text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800">Group by Site</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Organize into site histories
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={groupBySite}
            onClick={onToggleGroupBySite}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              groupBySite ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                groupBySite ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto-merge toggle */}
        <div className="flex items-start justify-between p-2.5 rounded-lg bg-white border border-slate-200/80">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <GitMerge size={13} className="text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800">Auto-merge Similar</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Detect duplicate incident events
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoMerge}
            onClick={onToggleAutoMerge}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              autoMerge ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                autoMerge ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Depth selector */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80">
          <div className="min-w-0 pr-2">
            <span className="text-xs font-semibold text-slate-800">Analysis Depth</span>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              SIF precursor parsing
            </p>
          </div>
          <div className="flex p-0.5 bg-slate-100 rounded-md border border-slate-200 text-[11px] font-semibold shrink-0">
            <button
              type="button"
              onClick={() => onChangeDepth('standard')}
              className={`px-2 py-0.5 rounded transition-colors ${
                depth === 'standard'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => onChangeDepth('detailed')}
              className={`px-2 py-0.5 rounded transition-colors ${
                depth === 'detailed'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
