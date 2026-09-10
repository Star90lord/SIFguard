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
      className={`bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden transition-all duration-150 ${className}`}
      {...props}
    >
      {hasHeader && (
        <div
          className={`p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-4 ${headerClassName}`}
        >
          <div>
            {title && (
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-sm sm:text-base font-bold text-slate-900 tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardSubtitle({ children, className = '' }) {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}
