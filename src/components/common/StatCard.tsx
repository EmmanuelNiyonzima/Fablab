import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  color?: 'emerald' | 'blue' | 'amber' | 'indigo' | 'rose' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'slate',
  onClick,
}) => {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    slate: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20',
  };

  const iconBgMap = {
    emerald: 'bg-emerald-600 text-white',
    blue: 'bg-blue-600 text-white',
    amber: 'bg-amber-600 text-white',
    indigo: 'bg-indigo-600 text-white',
    rose: 'bg-rose-600 text-white',
    slate: 'bg-slate-800 text-white',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg shadow-xs ${iconBgMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 font-medium truncate max-w-[200px]">{subtitle}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-semibold px-2 py-0.5 rounded-full ${
                trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
              {trend.label && <span className="ml-1 font-normal text-slate-500">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
