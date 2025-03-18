import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
  icon?: ReactNode;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  icon
}: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full font-medium";
  
  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm"
  };
  
  const variantClasses = {
    default: "bg-slate-800/40 text-slate-300 border border-slate-700/30",
    primary: "bg-indigo-800/40 text-indigo-300 border border-indigo-700/30",
    success: "bg-green-800/40 text-green-300 border border-green-700/30",
    warning: "bg-yellow-800/40 text-yellow-300 border border-yellow-700/30",
    danger: "bg-red-800/40 text-red-300 border border-red-700/30",
    info: "bg-blue-800/40 text-blue-300 border border-blue-700/30"
  };
  
  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {icon && <span className="mr-1.5 -ml-0.5">{icon}</span>}
      {children}
    </span>
  );
} 