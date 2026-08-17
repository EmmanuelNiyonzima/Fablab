import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold gap-1.5 rounded-md',
    md: 'px-4 py-2 text-xs font-bold gap-2 rounded-lg',
    lg: 'px-5 py-2.5 text-sm font-bold gap-2.5 rounded-xl',
  };

  const variantClasses = {
    // Primary: FabLab Green (Actions & Approvals)
    primary:
      'bg-[#009A44] hover:bg-[#007D37] active:bg-[#00662D] text-white shadow-xs focus:ring-2 focus:ring-[#009A44]/30 border border-transparent',
    // Secondary: FabLab Blue (Structural, Filters, Navigation)
    secondary:
      'bg-[#0F4C81] hover:bg-[#0A3962] active:bg-[#082D4E] text-white shadow-xs focus:ring-2 focus:ring-[#0F4C81]/30 border border-transparent',
    // Danger: FabLab Red (Deletions & Rejections)
    danger:
      'bg-[#E31B23] hover:bg-[#C2141B] active:bg-[#A31016] text-white shadow-xs focus:ring-2 focus:ring-[#E31B23]/30 border border-transparent',
    // Outline: Clean Neutral with subtle border
    outline:
      'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-slate-200',
    // Ghost: Subtle transparent
    ghost:
      'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 focus:ring-2 focus:ring-slate-200',
    // Link: Brand Blue text
    link:
      'bg-transparent text-[#0F4C81] hover:text-[#0A3962] hover:underline p-0 focus:ring-0',
  };

  const disabledClass = 'opacity-50 cursor-not-allowed pointer-events-none shadow-none';

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none font-sans ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${
        disabled || isLoading ? disabledClass : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};
