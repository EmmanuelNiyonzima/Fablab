import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  History, 
  Edit3, 
  HelpCircle,
  Sparkles,
  Zap,
  Building2,
  Wifi,
  Droplet
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { DiscrepancyBanner } from '../common/DiscrepancyBanner';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { AllocationPolicy, AllocationBasis } from '../../types/financial';

export const AllocationPoliciesView: React.FC = () => {
  const state = storageService.getState();
  const policies = state.allocationPolicies;
  const organizations = state.organizations;

  const [selectedPolicy, setSelectedPolicy] = useState<AllocationPolicy>(policies[0]);
  const [editingRules, setEditingRules] = useState<{ orgId: string; percentage: number }[]>(
    policies[0]?.rules || []
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const currentTotalPercentage = editingRules.reduce((sum, r) => sum + (r.percentage || 0), 0);
  const is100Percent = Math.abs(currentTotalPercentage - 100.0) < 0.01;

  const handleSelectPolicy = (p: AllocationPolicy) => {
    setSelectedPolicy(p);
    setEditingRules([...p.rules]);
    setIsEditing(false);
  };

  const handlePercentageChange = (orgId: string, value: number) => {
    setEditingRules((prev) =>
      prev.map((r) => (r.orgId === orgId ? { ...r, percentage: value } : r))
    );
  };

  const handleSavePolicy = () => {
    if (!is100Percent) {
      alert(`The sum of rule percentages must equal exactly 100%. Currently: ${currentTotalPercentage}%`);
      return;
    }

    storageService.updateAllocationPolicy(selectedPolicy.id, {
      rules: editingRules,
      effectiveDate: new Date().toISOString().split('T')[0],
      notes: editNotes || selectedPolicy.notes,
    });

    setIsEditing(false);
    alert('Allocation policy updated and saved! Shared expense allocations will calculate using the new proportions.');
  };

  const basisIcon = (basis: AllocationBasis) => {
    switch (basis) {
      case 'electricity_usage':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'floor_area':
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'water_usage':
        return <Droplet className="w-4 h-4 text-cyan-500" />;
      case 'headcount':
        return <Wifi className="w-4 h-4 text-emerald-500" />;
      default:
        return <Sliders className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Shared Expense Allocation Policies</h2>
            <Badge variant="purple">Formula Driven</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized mathematical models distributing facility overheads by floor area, power draw, headcount, or usage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral">Auto-Recalculate Active</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Policy Selector List */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Configured Policies ({policies.length})
          </p>
          <div className="space-y-2">
            {policies.map((p) => {
              const isSelected = selectedPolicy.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPolicy(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      {basisIcon(p.basis)}
                      <span>{p.name}</span>
                    </div>
                    <Badge variant={p.status === 'active' ? 'success' : 'neutral'} size="sm">
                      {p.basis.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{p.notes || `${p.categoryName} distribution`}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Policy Configurator */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedPolicy.name}</h3>
                  <Badge variant="info">Basis: {selectedPolicy.basis}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedPolicy.notes || `${selectedPolicy.categoryName} apportionment model`}</p>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start sm:self-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Adjust Percentages</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRules([...selectedPolicy.rules]);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePolicy}
                    disabled={!is100Percent}
                    className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs transition-colors ${
                      is100Percent ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Validation Banner */}
            <DiscrepancyBanner
              isBalanced={is100Percent}
              difference={Math.round((100 - currentTotalPercentage) * 100) / 100}
              moduleName="Policy Allocation Rules"
              message={
                is100Percent
                  ? `Rules strictly total 100.0%. All shared expenses under this policy will distribute with zero variance.`
                  : `Policy rule percentages sum to ${currentTotalPercentage}%. Must equal exactly 100.0%.`
              }
            />

            {/* Rules Adjuster Sliders & Inputs */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-700">Resident Organization Distribution Proportions:</p>
              <div className="space-y-3">
                {editingRules.map((rule) => {
                  const org = organizations.find((o) => o.id === rule.orgId);
                  const sampleExpense = 1000000; // 1M RWF
                  const sampleShare = Math.round(sampleExpense * (rule.percentage / 100));

                  return (
                    <div
                      key={rule.orgId}
                      className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{org?.name || rule.orgId}</span>
                          <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                            {org?.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Share of 1,000,000 RWF:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {FinancialCalculator.formatRWF(sampleShare)}
                          </span>
                          <div className="flex items-center gap-1 ml-2 font-mono">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              disabled={!isEditing}
                              value={rule.percentage}
                              onChange={(e) =>
                                handlePercentageChange(rule.orgId, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 p-1 text-center font-bold text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
                            />
                            <span className="text-slate-500 font-bold">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Visual Range Slider */}
                      {isEditing && (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.5"
                          value={rule.percentage}
                          onChange={(e) =>
                            handlePercentageChange(rule.orgId, parseFloat(e.target.value) || 0)
                          }
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revision Audit Log */}
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Effective Since: <strong className="text-slate-700">{selectedPolicy.effectiveDate}</strong></span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">ID: {selectedPolicy.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
