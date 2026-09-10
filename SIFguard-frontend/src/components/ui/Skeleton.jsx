import React from 'react';

export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function KpiSkeleton({ count = 1 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="p-4 sm:p-4.5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-2 rounded-full" />
          </div>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </>
  );
}

export function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`p-5 bg-white border border-slate-200 rounded-xl space-y-3.5 shadow-2xs ${className}`}>
      <div className="space-y-1.5 border-b border-slate-100 pb-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-60" />
      </div>
      <div className="space-y-2 pt-1">
        {[...Array(lines)].map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ className = '' }) {
  return (
    <div className={`p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-2xs ${className}`}>
      <div className="space-y-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-60 w-full rounded-lg" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiSkeleton count={5} />
      </div>

      {/* Attention panel skeleton */}
      <div className="h-20 bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-80" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <ChartSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="divide-y divide-slate-100">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-6">
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-20 rounded-md shrink-0" />
            <Skeleton className="h-4 w-28 shrink-0" />
            <Skeleton className="h-4 w-28 shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalysisSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-7 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2 border-b border-slate-100 pb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
