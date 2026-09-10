import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import ReportRow from './ReportRow';

const RISK_WEIGHTS = {
  'SIF-Precursor': 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export default function ReportsTable({ reports = [], onViewReport }) {
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'risk_level') {
        aVal = RISK_WEIGHTS[aVal] || 0;
        bVal = RISK_WEIGHTS[bVal] || 0;
      } else if (sortField === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [reports, sortField, sortDirection]);

  function renderSortIcon(field) {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-400 group-hover:text-slate-600" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} className="text-slate-900" />
    ) : (
      <ArrowDown size={12} className="text-slate-900" />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 select-none">
              <th
                scope="col"
                onClick={() => handleSort('timestamp')}
                className="group w-[120px] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {renderSortIcon('timestamp')}
                </div>
              </th>

              <th
                scope="col"
                className="min-w-[300px] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600"
              >
                Safety Report Snippet
              </th>

              <th
                scope="col"
                onClick={() => handleSort('risk_level')}
                className="group w-[140px] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Risk Level</span>
                  {renderSortIcon('risk_level')}
                </div>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('hazard')}
                className="group w-[140px] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Hazard</span>
                  {renderSortIcon('hazard')}
                </div>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('location')}
                className="group w-[120px] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Location</span>
                  {renderSortIcon('location')}
                </div>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('activity')}
                className="group w-[150px] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Activity</span>
                  {renderSortIcon('activity')}
                </div>
              </th>

              <th
                scope="col"
                className="w-[90px] px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedReports.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                onSelect={onViewReport}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
