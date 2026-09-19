'use client';

import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { FormField } from './FormField';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  helperText?: React.ReactNode;
  labelRight?: React.ReactNode;
  containerClassName?: string;
  textareaClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      required,
      error,
      helperText,
      labelRight,
      containerClassName,
      textareaClassName,
      className,
      rows = 3,
      disabled,
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
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full rounded-[10px] border p-3 text-white text-sm transition-all focus:outline-none placeholder:text-slate-500 resize-y',
            error
              ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 text-white'
              : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-900/50',
            textareaClassName,
            className
          )}
          {...props}
        />
      </FormField>
    );
  }
);

Textarea.displayName = 'Textarea';
