import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary:
        'bg-potionPurple text-white hover:bg-potionPurple-hover shadow-lg shadow-potionPurple/25 border border-potionPurple/50',
      secondary:
        'bg-white/10 text-white hover:bg-white/15 border border-white/10',
      outline:
        'border border-white/20 bg-transparent text-white hover:bg-white/5',
      danger:
        'bg-dangerRed/80 text-white hover:bg-dangerRed border border-dangerRed',
      ghost:
        'bg-transparent text-paleLavender hover:bg-white/5 hover:text-white',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg',
      md: 'px-4 py-2 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-potionPurple disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
