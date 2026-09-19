'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FormField } from './FormField';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  helperText?: React.ReactNode;
  labelRight?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      id,
      label,
      required,
      error,
      helperText,
      labelRight,
      containerClassName,
      inputClassName,
      className,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);

    const openCalendarPicker = () => {
      if (disabled) return;
      try {
        internalRef.current?.showPicker?.();
      } catch {
        internalRef.current?.focus();
      }
    };

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
          <button
            type="button"
            onClick={openCalendarPicker}
            disabled={disabled}
            tabIndex={-1}
            className="absolute left-3.5 text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center cursor-pointer focus:outline-none z-10"
            title="Open calendar picker"
            aria-label="Open calendar picker"
          >
            <Calendar className="h-4 w-4 shrink-0" />
          </button>

          <input
            ref={internalRef}
            id={id}
            type="date"
            disabled={disabled}
            onClick={(e) => {
              try {
                e.currentTarget.showPicker?.();
              } catch {}
              onClick?.(e);
            }}
            className={cn(
              'w-full h-10 rounded-[10px] border text-white text-sm transition-all focus:outline-none pl-10 pr-3.5 [color-scheme:dark] cursor-pointer',
              error
                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 text-white'
                : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
              disabled && 'opacity-60 cursor-not-allowed bg-slate-900/50',
              inputClassName,
              className
            )}
            {...props}
          />
        </div>
      </FormField>
    );
  }
);

DatePicker.displayName = 'DatePicker';
