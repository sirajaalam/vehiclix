'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 12, 24],
  itemLabel = 'items',
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.08] text-xs">
      {/* Left: Summary and optional Page Size selector */}
      <div className="flex items-center gap-3 text-slate-400">
        <span>
          Showing <strong className="text-white font-semibold">{startItem}</strong> to{' '}
          <strong className="text-white font-semibold">{endItem}</strong> of{' '}
          <strong className="text-white font-semibold">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && pageSizeOptions.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-white/[0.1]">
            <span className="text-slate-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-full bg-slate-900 border border-white/[0.1] px-2 py-0.5 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Pills */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous Page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] transition-all cursor-pointer ${
              currentPage <= 1
                ? 'opacity-40 cursor-not-allowed text-slate-600 bg-transparent'
                : 'text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 active:scale-95'
            }`}
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Number Pills */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-1 text-slate-600 font-mono">
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`flex h-8 min-w-[32px] px-2 items-center justify-center rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_2px_8px_rgba(16,185,129,0.35)] scale-105'
                      : 'text-slate-300 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-white/[0.06] active:scale-95'
                  }`}
                  aria-label={`Page ${pageNum}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] transition-all cursor-pointer ${
              currentPage >= totalPages
                ? 'opacity-40 cursor-not-allowed text-slate-600 bg-transparent'
                : 'text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 active:scale-95'
            }`}
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
