import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface DiscrepancyBannerProps {
  id?: string;
  isBalanced: boolean;
  difference?: number;
  message?: string;
  moduleName?: string;
  unit?: string;
  actionText?: string;
  onAction?: () => void;
}

export const DiscrepancyBanner: React.FC<DiscrepancyBannerProps> = ({
  id,
  isBalanced,
  difference = 0,
  message,
  moduleName = 'Allocation',
  unit = 'RWF',
  actionText,
  onAction,
}) => {
  if (isBalanced) {
    return (
      <div id={id} className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-800">
        <div className="flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">Reconciliation Verified:</span>
          <span>{message || `${moduleName} totals are strictly balanced and 100% reconciled.`}</span>
        </div>
        <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">BALANCED (0 {unit} Diff)</span>
      </div>
    );
  }

  return (
    <div id={id} className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 shadow-xs">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-rose-800 text-sm">Discrepancy Detected in {moduleName}</p>
          <p className="mt-0.5 text-rose-700">
            {message || `The sum of allocated lines does not match 100.0%. Variance: ${difference.toLocaleString()} ${unit}.`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center">
        <span className="font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md whitespace-nowrap">
          Diff: {difference.toLocaleString()} {unit}
        </span>
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};
