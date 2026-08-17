import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
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
  color?: 'green' | 'blue' | 'red' | 'amber' | 'slate' | 'emerald';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
}) => {
  // Normalize color aliases
  const activeColor = color === 'emerald' ? 'green' : color;

  const iconBgMap: Record<string, string> = {
    // FabLab Green (Profit, Revenue, Cash Balance, Positive)
    green: 'bg-[#009A44] text-white ring-4 ring-[#009A44]/15',
    // FabLab Blue (Structural, Receivables, Allocation, Neutral)
    blue: 'bg-[#0F4C81] text-white ring-4 ring-[#0F4C81]/15',
    // FabLab Red (Expenses, Payables, Overdue, Critical)
    red: 'bg-[#E31B23] text-white ring-4 ring-[#E31B23]/15',
    // Warning Amber
    amber: 'bg-amber-600 text-white ring-4 ring-amber-500/15',
    // Neutral Slate
    slate: 'bg-slate-800 text-white ring-4 ring-slate-800/15',
  };

  const topBorderMap: Record<string, string> = {
    green: 'border-t-2 border-t-[#009A44]',
    blue: 'border-t-2 border-t-[#0F4C81]',
    red: 'border-t-2 border-t-[#E31B23]',
    amber: 'border-t-2 border-t-amber-500',
    slate: 'border-t-2 border-t-slate-700',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
        topBorderMap[activeColor] || ''
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>
          <p className="text-2xl font-black text-slate-900 tracking-tight font-numeric truncate">
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl shadow-xs shrink-0 ${iconBgMap[activeColor] || iconBgMap.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
          {subtitle && (
            <span className="text-slate-500 font-medium truncate" title={subtitle}>
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={`inline-flex items-center font-bold px-2 py-0.5 rounded-md text-[11px] shrink-0 font-numeric ${
                trend.isPositive
                  ? 'bg-[#E8F8EE] text-[#007D37] border border-[#A7E7BF]'
                  : 'bg-[#FDF1F1] text-[#C2141B] border border-[#F9BFC1]'
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
