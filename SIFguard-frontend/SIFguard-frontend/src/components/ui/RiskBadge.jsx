import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Flame } from 'lucide-react';

const RISK_CONFIG = {
  Low: {
    label: 'LOW',
    icon: ShieldCheck,
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
    iconColor: 'text-emerald-600',
    description: 'Standard operational risk; routine controls in place',
  },
  Medium: {
    label: 'MEDIUM',
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-900 border-amber-300/80',
    iconColor: 'text-amber-600',
    description: 'Moderate hazard requiring supervisory awareness',
  },
  High: {
    label: 'HIGH',
    icon: AlertOctagon,
    className: 'bg-orange-50 text-orange-950 border-orange-300/90',
    iconColor: 'text-orange-600',
    description: 'Elevated risk requiring active verification and control',
  },
  'SIF-Precursor': {
    label: 'SIF-PRECURSOR',
    icon: Flame,
    className: 'bg-red-100/80 text-red-950 border-red-400 font-bold shadow-2xs',
    iconColor: 'text-red-600',
    description: 'Potential Serious Injury or Fatality precursor; immediate review required',
  },
};

export default function RiskBadge({
  level = 'Low',
  size = 'sm',
  showIcon = true,
  className = '',
}) {
  const normalizedKey =
    level === 'SIF' || level === 'SIF-Precursor' || level === 'SIF Precursor' || level === 'sif'
      ? 'SIF-Precursor'
      : level === 'High' || level === 'high'
      ? 'High'
      : level === 'Medium' || level === 'medium' || level === 'Med'
      ? 'Medium'
      : 'Low';

  const config = RISK_CONFIG[normalizedKey] || RISK_CONFIG.Low;
  const Icon = config.icon;
  const isLg = size === 'lg';
  const isMd = size === 'md';

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider uppercase border transition-colors select-none ${
        isLg
          ? 'px-3 py-1 text-xs gap-1.5 rounded-full'
          : isMd
          ? 'px-2.5 py-0.5 text-[11px] gap-1.5 rounded-full'
          : 'px-2 py-0.5 text-[10px] gap-1 rounded-full'
      } ${config.className} ${className}`}
      role="status"
      aria-label={`Risk level: ${config.label}`}
      title={config.description}
    >
      {showIcon && (
        <Icon
          size={isLg ? 14 : isMd ? 12 : 11}
          className={`${config.iconColor} shrink-0`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
