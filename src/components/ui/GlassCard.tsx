import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  key?: React.Key;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function GlassCard({ children, className = '', ...props }: GlassCardProps) {
  return (
    <div 
      className={`backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-xl rounded-2xl hover:border-primary/40 dark:hover:border-primary/40 text-slate-900 dark:text-slate-100 transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
