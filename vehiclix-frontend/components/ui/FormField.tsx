'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FormFieldProps {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  helperText?: React.ReactNode;
  error?: string;
  className?: string;
  labelRight?: React.ReactNode;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required,
  helperText,
  error,
  className,
  labelRight,
  children,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label
            htmlFor={id}
            className="block text-xs font-medium text-slate-300 tracking-wide select-none"
          >
            {label}
            {required && <span className="text-rose-400 font-bold ml-1">*</span>}
          </label>
          {labelRight && <div className="text-xs text-slate-400">{labelRight}</div>}
        </div>
      )}

      {children}

      {error ? (
        <p
          id={id ? `${id}-error` : undefined}
          className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
