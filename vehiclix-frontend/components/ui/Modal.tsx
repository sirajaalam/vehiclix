'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  size?: ModalSize;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  id?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-[96vw] max-h-[96vh]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  footer,
  children,
  className,
  bodyClassName,
  headerClassName,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  id,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden animate-in fade-in duration-150"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={contentRef}
        className={cn(
          'w-full max-h-[92vh] rounded-[20px] border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || icon) && (
          <div
            className={cn(
              'flex items-center justify-between border-b border-white/[0.06] px-5 sm:px-6 py-4 sm:py-4.5 bg-slate-900/90 shrink-0',
              headerClassName
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {icon && <div className="shrink-0">{icon}</div>}
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {title}
                </h2>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 sm:p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className={cn('flex-1 overflow-y-auto p-5 sm:p-6', bodyClassName)}>{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-white/[0.08] px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-900/90 flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
