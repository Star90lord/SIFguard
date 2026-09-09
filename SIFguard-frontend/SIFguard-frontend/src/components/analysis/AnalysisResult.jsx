import React from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  MapPin,
  Briefcase,
  AlertTriangle,
  ShieldX,
} from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import AnalysisField from './AnalysisField';

const RISK_DESCRIPTORS = {
  Low: {
    meaning: 'Controlled operational observation',
    badgeVariant: 'Low',
    bannerClass: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900',
    icon: CheckCircle,
  },
  Medium: {
    meaning: 'Moderate operational risk requiring control verification',
    badgeVariant: 'Medium',
    bannerClass: 'bg-amber-50/70 border-amber-200/80 text-amber-950',
    icon: AlertTriangle,
  },
  High: {
    meaning: 'Elevated safety risk requiring supervisory intervention',
    badgeVariant: 'High',
    bannerClass: 'bg-orange-50/70 border-orange-200/80 text-orange-950',
    icon: AlertOctagon,
  },
  'SIF-Precursor': {
    meaning: 'Critical SIF precursor — immediate barrier failure and high-energy hazard',
    badgeVariant: 'SIF-Precursor',
    bannerClass: 'bg-red-50/80 border-red-200 text-red-950',
    icon: ShieldAlert,
  },
};

export default function AnalysisResult({ result, onReset, onViewReports }) {
  if (!result) return null;

  const riskKey = result.risk_level || 'Low';
  const meta = RISK_DESCRIPTORS[riskKey] || RISK_DESCRIPTORS.Low;
  const RiskIcon = meta.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden divide-y divide-slate-100">
      {/* Result Header & Severity Banner */}
      <div className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Intelligence Assessment
            </span>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Analysis Memorandum
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge level={result.risk_level} size="lg" />
          </div>
        </div>

        {/* Severity Banner */}
        <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${meta.bannerClass}`}>
          <RiskIcon size={20} className="shrink-0" />
          <div className="text-xs sm:text-sm leading-snug flex items-center flex-wrap gap-x-1.5">
            <span className="uppercase tracking-wider font-bold">
              {result.risk_level}:
            </span>
            <span className="font-medium">{meta.meaning}</span>
          </div>
        </div>
      </div>

      {/* Extracted Fields (2-column industrial layout with subtle dividers) */}
      <div className="p-6 sm:p-7 bg-slate-50/40">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Extracted Operational Parameters
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 divide-y sm:divide-y-0 sm:divide-x-0 divide-slate-100">
          <AnalysisField
            label="Identified Hazard"
            value={result.hazard}
            icon={AlertTriangle}
          />
          <AnalysisField
            label="Operational Activity"
            value={result.activity}
            icon={Briefcase}
          />
          <AnalysisField
            label="Facility / Location"
            value={result.location}
            icon={MapPin}
          />
          <AnalysisField
            label="Critical Barrier Failure"
            value={result.barrier_failure}
            icon={ShieldX}
          />
        </div>
      </div>

      {/* Explanation Section */}
      <div className="p-6 sm:p-7">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Why this was classified as {result.risk_level.toLowerCase()} risk
        </h4>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-800 leading-relaxed font-normal">
          {result.explanation}
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 sm:px-7 bg-white flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={onReset}
          icon={RotateCcw}
        >
          Analyze Another Report
        </Button>

        {onViewReports && (
          <Button
            variant="primary"
            size="md"
            onClick={onViewReports}
            className="gap-2"
          >
            <span>View in Reports</span>
            <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
