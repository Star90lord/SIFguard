import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

export default function AttentionPanel({ sifCount = 3 }) {
  const navigate = useNavigate();

  return (
    <div className="bg-red-50/60 border border-red-200/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0 text-red-700">
          <AlertTriangle size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-800">
              Attention Required
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">
            {sifCount} SIF-Precursor incident reports require immediate HSE review and barrier verification.
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Critical controls bypassed in Confined Space entry and scaffold operations.
          </p>
        </div>
      </div>

      <div className="shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/reports?risk=SIF-Precursor')}
          className="border-red-300 text-red-900 hover:bg-red-100 hover:border-red-400 font-semibold gap-1.5"
        >
          <span>View Reports</span>
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}
