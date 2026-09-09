import React from 'react';
import { ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

export default function ReportRow({ report, onSelect }) {
  return (
    <tr
      onClick={() => onSelect(report)}
      className="group border-b border-slate-100 hover:bg-blue-50/30 cursor-pointer transition-colors duration-150 select-none"
    >
      {/* Date */}
      <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-500 font-medium">
        {formatDate(report.timestamp)}
      </td>

      {/* Report Snippet */}
      <td className="px-5 py-4 max-w-xs md:max-w-md lg:max-w-lg">
        <p
          className="text-xs sm:text-[13px] text-slate-900 font-medium truncate group-hover:text-blue-900 transition-colors"
          title={report.full_text || report.text_snippet}
        >
          {report.text_snippet}
        </p>
      </td>

      {/* Risk Level */}
      <td className="px-5 py-4 whitespace-nowrap">
        <Badge level={report.risk_level} size="sm" />
      </td>

      {/* Hazard */}
      <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-slate-700">
        {report.hazard}
      </td>

      {/* Location */}
      <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-slate-600">
        {report.location}
      </td>

      {/* Activity */}
      <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-slate-600">
        {report.activity}
      </td>

      {/* Action */}
      <td className="px-5 py-4 text-right whitespace-nowrap">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-blue-700 transition-colors">
          <span>Details</span>
          <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </td>
    </tr>
  );
}
