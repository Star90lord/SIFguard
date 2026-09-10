import React from 'react';

export default function Card({
  title,
  subtitle,
  action,
  children,
  footer,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  ...props
}) {
  const hasHeader = Boolean(title || subtitle || action);

  return (
    <div
      className={`bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs overflow-hidden transition-all duration-150 ${className}`}
      {...props}
    >
      {hasHeader && (
        <div
          className={`p-4 sm:p-5 border-b border-[#D1D5DB]/80 dark:border-[#263244] flex items-start justify-between gap-4 ${headerClassName}`}
        >
          <div>
            {title && (
              <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-4 sm:px-5 py-3 border-t border-[#D1D5DB]/80 dark:border-[#263244] bg-slate-50/70 dark:bg-[#070B12]/50 text-xs text-[#334155] dark:text-[#CBD5E1] flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-4 sm:p-5 border-b border-[#D1D5DB]/80 dark:border-[#263244] flex items-start justify-between gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-sm sm:text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div
      className={`px-4 sm:px-5 py-3 border-t border-[#D1D5DB]/80 dark:border-[#263244] bg-slate-50/70 dark:bg-[#070B12]/50 text-xs text-[#334155] dark:text-[#CBD5E1] flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
}
