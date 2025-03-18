import React, { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = "rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };
  
  const variantClasses = {
    primary: "btn-primary text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40",
    secondary: "bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600",
    outline: "bg-transparent hover:bg-slate-800/50 text-gray-300 border border-slate-600",
    ghost: "bg-transparent hover:bg-slate-800/50 text-gray-300",
    danger: "bg-red-700/80 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
  };
  
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled || isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]";
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : icon && iconPosition === 'left' ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      
      {children}
      
      {icon && iconPosition === 'right' && !isLoading ? (
        <span className="ml-2">{icon}</span>
      ) : null}
    </button>
  );
} 