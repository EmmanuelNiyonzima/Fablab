import React from 'react';

export type BadgeVariant = 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'neutral' 
  | 'purple'
  | 'outline';

interface BadgeProps {
  id?: string;
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  id,
  variant = 'neutral',
  children,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80 font-medium',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-medium',
    info: 'bg-blue-50 text-blue-700 border border-blue-200/80 font-medium',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
    purple: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium',
    outline: 'bg-transparent text-slate-700 border border-slate-300 font-medium',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1 rounded-full leading-none whitespace-nowrap ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status.toLowerCase()) {
    case 'posted':
    case 'paid':
    case 'approved':
    case 'balanced':
    case 'active':
    case 'pass':
      return <Badge variant="success">● {status}</Badge>;
    case 'submitted':
    case 'partially paid':
    case 'warning':
      return <Badge variant="warning">▲ {status}</Badge>;
    case 'draft':
      return <Badge variant="neutral">○ {status}</Badge>;
    case 'rejected':
    case 'overdue':
    case 'cancelled':
    case 'not balanced':
    case 'fail':
      return <Badge variant="danger">✕ {status}</Badge>;
    default:
      return <Badge variant="info">{status}</Badge>;
  }
};
