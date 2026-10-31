import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'orange' | 'outline';
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-white border-white/20',
    success: 'bg-successGreen/20 text-emerald-300 border-successGreen/40',
    warning: 'bg-warningAmber/20 text-amber-300 border-warningAmber/40',
    danger: 'bg-dangerRed/20 text-rose-300 border-dangerRed/40',
    purple: 'bg-potionPurple/20 text-violetGlow border-potionPurple/40',
    orange: 'bg-emberOrange/20 text-amber-400 border-emberOrange/40',
    outline: 'border border-white/20 text-white bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
