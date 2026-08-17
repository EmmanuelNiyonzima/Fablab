import React from 'react';

export type BadgeVariant = 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'neutral' 
  | 'brand-blue'
  | 'brand-green'
  | 'brand-red'
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
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  const variantClasses: Record<BadgeVariant, string> = {
    // FabLab Green: Approved, Posted, Paid, Positive Variance
    success: 'bg-[#E8F8EE] text-[#007D37] border border-[#A7E7BF] font-semibold',
    'brand-green': 'bg-[#009A44] text-white font-bold',
    // FabLab Red: Overdue, Rejected, Over Budget, Critical Error
    danger: 'bg-[#FDF1F1] text-[#C2141B] border border-[#F9BFC1] font-semibold',
    'brand-red': 'bg-[#E31B23] text-white font-bold',
    // FabLab Blue: Pending, Allocation, Budget, System Information
    info: 'bg-[#EBF3FA] text-[#0F4C81] border border-[#BCD4EA] font-semibold',
    'brand-blue': 'bg-[#0F4C81] text-white font-bold',
    // Warning Amber
    warning: 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
    // Neutral Slate
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
    outline: 'bg-transparent text-slate-700 border border-slate-300 font-medium',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1 rounded-md leading-tight whitespace-nowrap ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case 'posted':
    case 'paid':
    case 'approved':
    case 'balanced':
    case 'active':
    case 'pass':
    case 'completed':
    case 'favorable':
    case 'under budget':
      return <Badge variant="success" size={size}>● {status}</Badge>;

    case 'submitted':
    case 'partially paid':
    case 'warning':
    case 'in progress':
      return <Badge variant="warning" size={size}>▲ {status}</Badge>;

    case 'draft':
    case 'unassigned':
      return <Badge variant="neutral" size={size}>○ {status}</Badge>;

    case 'rejected':
    case 'overdue':
    case 'cancelled':
    case 'not balanced':
    case 'fail':
    case 'unfavorable':
    case 'over budget':
      return <Badge variant="danger" size={size}>✕ {status}</Badge>;

    case 'pending':
    case 'allocated':
    case 'budget':
      return <Badge variant="info" size={size}>◈ {status}</Badge>;

    default:
      return <Badge variant="info" size={size}>{status}</Badge>;
  }
};
