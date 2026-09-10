import React from 'react';
import {
  Calendar,
  Building2,
  AlertTriangle,
  Briefcase,
  MapPin,
  ShieldX,
  ChevronRight,
  Cpu,
  Flame,
  Wrench,
  Zap,
} from 'lucide-react';
import { RiskBadge } from '../ui/Badge';

export default function AnalysisResultCard({ report, onSelectReport }) {
  if (!report) return null;

  const siteName = report.site || report.siteName || report.location || 'Operational Site';
  const displayTime = report.time || (report.timestamp ? new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null);
  const formattedDate = `${report.date}${displayTime ? ` · ${displayTime}` : ''}`;

  const entities = report.entities || {};
  const extractedEntities = report.extractedEntities || report.raw_ner_entities || [];
  const hazards = entities.hazards || extractedEntities.filter((e) => e.label === 'HAZARD').map((e) => e.text);
  const equipment = entities.equipment || extractedEntities.filter((e) => e.label === 'EQUIPMENT').map((e) => e.text);
  const energies = entities.energies || extractedEntities.filter((e) => e.label === 'ENERGY').map((e) => e.text);

  const riskAssessment = report.risk_assessment || report.riskAssessment || {};
  const hasRiskScores = riskAssessment.severity !== undefined && riskAssessment.likelihood !== undefined;

  return (
    <div
      onClick={() => onSelectReport && onSelectReport(report)}
      className="p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-md transition-all duration-150 cursor-pointer group space-y-3.5"
      role="button"
      tabIndex={0}
      aria-label={`Inspect report from ${siteName} on ${formattedDate}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectReport && onSelectReport(report);
        }
      }}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-bold text-slate-700">{formattedDate}</span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70">
            <Building2 size={12} className="text-slate-400" />
            <span>{siteName}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <RiskBadge level={report.risk_level} size="sm" />
          {report.sif_precursor && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
              SIF Precursor
            </span>
          )}
        </div>
      </div>

      {/* Primary Hazard & Operational Attributes */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {report.hazard || 'Safety Observation'}
          </h4>
          <span className="text-xs text-slate-500 font-medium">{report.activity}</span>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {report.text_snippet || report.full_text || report.report_text}
        </p>
      </div>

      {/* Extracted NLP Entities Badges */}
      {(hazards.length > 0 || equipment.length > 0 || energies.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Cpu size={10} /> NLP Detected:
          </span>
          {hazards.slice(0, 2).map((h, i) => (
            <span
              key={`h-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold"
            >
              <Flame size={10} className="text-red-500" />
              <span>{h}</span>
            </span>
          ))}
          {equipment.slice(0, 2).map((eq, i) => (
            <span
              key={`eq-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold"
            >
              <Wrench size={10} className="text-blue-500" />
              <span>{eq}</span>
            </span>
          ))}
          {energies.slice(0, 1).map((en, i) => (
            <span
              key={`en-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold"
            >
              <Zap size={10} className="text-amber-500" />
              <span>{en}</span>
            </span>
          ))}
        </div>
      )}

      {/* Deterministic Risk Matrix Indicator */}
      {hasRiskScores && (
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Severity: <strong className="text-slate-900">{riskAssessment.severityLabel || riskAssessment.severity}/5</strong>
            </span>
            <span>
              Likelihood: <strong className="text-slate-900">{riskAssessment.likelihoodLabel || riskAssessment.likelihood}/5</strong>
            </span>
          </div>
          <span className="font-bold text-blue-700">
            Score: {riskAssessment.riskScore || (riskAssessment.severity * riskAssessment.likelihood)}
          </span>
        </div>
      )}

      {/* Location and Barrier Failure Strip */}
      <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 truncate">
          <MapPin size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">{report.location || siteName}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700 font-medium justify-between sm:justify-end">
          <div className="flex items-center gap-1 truncate text-amber-900">
            <ShieldX size={12} className="text-amber-600 shrink-0" />
            <span className="truncate text-[11px]">
              {report.barrier_failure ? `Barrier: ${report.barrier_failure}` : 'Barrier: None'}
            </span>
          </div>
          <ChevronRight
            size={14}
            className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1"
          />
        </div>
      </div>
    </div>
  );
}
