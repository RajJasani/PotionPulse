import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-mutedText">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl border border-white/10 bg-[#171321]/80 px-4 py-2 text-sm text-white placeholder:text-mutedText/60 focus:border-potionPurple focus:outline-none focus:ring-1 focus:ring-potionPurple transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-dangerRed focus:border-dangerRed focus:ring-dangerRed',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-dangerRed font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-mutedText">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
