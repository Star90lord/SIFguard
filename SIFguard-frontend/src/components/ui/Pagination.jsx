import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Local Pagination Component for SIFguard
 * 
 * Order: DATA -> FILTER -> SORT -> PAGINATE -> DISPLAY
 * Automatically hides when all items fit on one page.
 * Responsive design: full numbered sequence on desktop, compact controls on mobile.
 */
export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  itemLabel = 'items',
  className = '',
}) {
  const totalPages = Math.ceil(totalItems / pageSize);

  // If there are no items or everything fits on a single page, hide pagination
  if (totalPages <= 1 || totalItems === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Helper to generate visible page numbers with ellipsis
  function getPageNumbers() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [
      1,
      'ellipsis-left',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis-right',
      totalPages,
    ];
  }

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`px-4 py-3 bg-white dark:bg-[#111827] border border-[#D1D5DB] dark:border-[#263244] rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#334155] dark:text-[#CBD5E1] ${className}`}
    >
      {/* Item range count */}
      <div className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
        Showing <strong className="text-[#0F172A] dark:text-[#F8FAFC] font-bold">{startItem}</strong>–
        <strong className="text-[#0F172A] dark:text-[#F8FAFC] font-bold">{endItem}</strong> of{' '}
        <strong className="text-[#0F172A] dark:text-[#F8FAFC] font-bold">{totalItems}</strong> {itemLabel}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 select-none">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#263244] text-[#334155] dark:text-[#CBD5E1] bg-white dark:bg-[#172033] hover:bg-slate-100 dark:hover:bg-[#1e293b] disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Desktop Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((num, idx) => {
            if (num === 'ellipsis-left' || num === 'ellipsis-right') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-400 dark:text-slate-500 font-mono text-xs select-none"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isActive = num === currentPage;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onPageChange(num)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[32px] h-8 px-2 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white border border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-[#172033] border border-[#D1D5DB] dark:border-[#263244] text-[#334155] dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#1e293b]'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Mobile Page Indicator */}
        <span className="sm:hidden font-mono text-xs text-[#64748B] dark:text-[#94A3B8] px-2">
          Page {currentPage} of {totalPages}
        </span>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#263244] text-[#334155] dark:text-[#CBD5E1] bg-white dark:bg-[#172033] hover:bg-slate-100 dark:hover:bg-[#1e293b] disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
}
