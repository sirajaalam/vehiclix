'use client';

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FormField } from './FormField';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  helperText?: React.ReactNode;
  labelRight?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showPasswordToggle?: boolean;
  containerClassName?: string;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      required,
      error,
      helperText,
      labelRight,
      leftIcon,
      rightIcon,
      rightElement,
      showPasswordToggle = false,
      containerClassName,
      inputClassName,
      className,
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword && showPasswordToggle && passwordVisible ? 'text' : type;

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

          <input
            ref={ref}
            id={id}
            type={computedType}
            disabled={disabled}
            className={cn(
              'w-full h-10 rounded-[10px] border text-white text-sm transition-all focus:outline-none placeholder:text-slate-500',
              'px-3.5',
              leftIcon && 'pl-10',
              (rightIcon || rightElement || (isPassword && showPasswordToggle)) && 'pr-10',
              error
                ? 'border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 text-white'
                : 'border-white/[0.1] bg-slate-950/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
              disabled && 'opacity-60 cursor-not-allowed bg-slate-900/50',
              inputClassName,
              className
            )}
            {...props}
          />

          {isPassword && showPasswordToggle ? (
            <button
              type="button"
              onClick={() => setPasswordVisible((prev) => !prev)}
              className="absolute right-3.5 text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : rightElement ? (
            <div className="absolute right-3.5 flex items-center">{rightElement}</div>
          ) : rightIcon ? (
            <div className="absolute right-3.5 text-slate-500 pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          ) : null}
        </div>
      </FormField>
    );
  }
);

Input.displayName = 'Input';
