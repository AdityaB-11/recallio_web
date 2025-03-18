import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  withGradient?: boolean;
  delay?: number;
}

export default function Card({ children, className = '', withGradient = false, delay = 0 }: CardProps) {
  const baseClasses = "rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-sm animate-fadeIn";
  const gradientClasses = withGradient ? "card-gradient" : "bg-slate-800";
  const delayStyle = delay > 0 ? { animationDelay: `${delay}s` } : {};
  
  return (
    <div 
      className={`${baseClasses} ${gradientClasses} ${className}`}
      style={delayStyle}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function CardHeader({ children, className = '', icon }: CardHeaderProps) {
  return (
    <div className={`flex items-center mb-4 ${className}`}>
      {icon && <div className="mr-3">{icon}</div>}
      <h2 className="text-2xl font-bold text-white font-heading">{children}</h2>
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 flex justify-end border-t border-slate-700/50 ${className}`}>
      {children}
    </div>
  );
} 