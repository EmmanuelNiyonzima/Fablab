import React from 'react';

export interface CardProps {
  id?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  id,
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) => {
  return (
    <div
      id={id}
      className={`bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden transition-all duration-150 ${className}`}
    >
      {(title || actions) && (
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            {title && <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`${noPadding ? '' : 'p-5'} ${bodyClassName}`}>{children}</div>
    </div>
  );
};
