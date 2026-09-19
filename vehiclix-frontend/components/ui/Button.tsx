'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'warning' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-sm shadow-emerald-500/20 active:bg-emerald-600',
  secondary:
    'border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 font-medium active:bg-white/[0.03]',
  outline:
    'border border-white/[0.15] bg-transparent hover:bg-white/[0.06] text-white font-medium active:bg-white/[0.03]',
  danger:
    'bg-rose-500 hover:bg-rose-400 text-white font-semibold shadow-sm shadow-rose-500/20 active:bg-rose-600',
  warning:
    'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-sm shadow-amber-500/20 active:bg-amber-600',
  ghost:
    'bg-transparent hover:bg-white/[0.08] text-slate-300 hover:text-white font-medium',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] rounded-lg gap-1.5',
  sm: 'h-8.5 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-[10px] gap-2',
  lg: 'h-11.5 px-5 text-sm sm:text-base rounded-xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(
          'apple-btn inline-flex items-center justify-center transition-all select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          isDisabled && 'opacity-60 cursor-not-allowed pointer-events-none active:scale-100',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
