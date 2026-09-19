'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FormField } from './FormField';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  helperText?: React.ReactNode;
  labelRight?: React.ReactNode;
  leftIcon?: React.ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  selectClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      required,
      error,
      helperText,
      labelRight,
      leftIcon,
      options,
      placeholder,
      containerClassName,
      selectClassName,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <FormField
        id={id}
        label={label}
        required={required}
        error={error}
        helperText={helperText}
        labelRight={labelRight}
        className={containerClassName}
      >
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            id={id}
            disabled={disabled}
            className={cn(
              'w-full h-10 rounded-[10px] border text-white text-sm transition-all focus:outline-none cursor-pointer appearance-none bg-slate-950/80',
              'px-3.5 pr-10',
              leftIcon && 'pl-10',
              error
                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 text-white'
                : 'border-white/[0.1] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
              disabled && 'opacity-60 cursor-not-allowed bg-slate-900/50',
              selectClassName,
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-slate-950 text-slate-500">
                {placeholder}
              </option>
            )}

            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-slate-950 text-white"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </FormField>
    );
  }
);

Select.displayName = 'Select';
