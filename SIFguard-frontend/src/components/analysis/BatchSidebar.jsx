import React from 'react';
import { Check, ShieldCheck, FileCheck, Layers, Calendar, AlertOctagon } from 'lucide-react';

export default function BatchSidebar({
  fileCount = 0,
  hasAnalyzed = false,
  results = [],
  className = '',
}) {
  const features = [
    { label: 'Multi-document ingestion', icon: FileCheck },
    { label: 'Automatic site grouping', icon: Layers },
    { label: 'Chronological timeline parsing', icon: Calendar },
    { label: 'Deterministic risk scoring', icon: ShieldCheck },
    { label: 'SIF precursor isolation', icon: AlertOctagon },
  ];

  return (
    <aside className={`space-y-4 ${className}`} aria-label="Batch telemetry summary">
      {/* Capability panel */}
      <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Intelligence Engine
          </h4>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          SIFguard parses unstructured incident records into structured site intelligence with zero manual tagging.
        </p>

        <ul className="space-y-2 pt-2 border-t border-slate-100">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                <span className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-emerald-600" />
                </span>
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Formats info */}
      <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 text-xs space-y-2">
        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
          Supported Ingestion Formats
        </span>
        <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold">.PDF</span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold">.DOCX</span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold">.TXT</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          Batch limits: up to 25 files per execution. Automatic OCR applied for scanned documentation.
        </p>
      </div>
    </aside>
  );
}
