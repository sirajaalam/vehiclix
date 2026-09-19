'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className,
  disabled = false,
  id,
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      // Simulate synthetic change event to reset
      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  return (
    <div className={cn('relative flex-1 w-full sm:max-w-md', className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />

      <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'w-full h-10 rounded-xl border border-white/[0.08] bg-slate-900/60 pl-9.5 pr-8 text-xs sm:text-sm text-white placeholder:text-slate-500',
          'focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      />

      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer p-0.5 rounded-full"
          aria-label="Clear search query"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
