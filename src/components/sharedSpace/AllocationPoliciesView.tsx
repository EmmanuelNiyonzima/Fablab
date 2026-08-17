import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  CheckCircle, 
  AlertCircle, 
  History, 
  Edit3, 
  Zap,
  Building2,
  Wifi,
  Droplet,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Lock
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { DiscrepancyBanner } from '../common/DiscrepancyBanner';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { AllocationPolicy, AllocationBasis } from '../../types/financial';

export const AllocationPoliciesView: React.FC = () => {
  const state = storageService.getState();
  const currentUser = storageService.getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';
  
  const policies = state.allocationPolicies;
  const organizations = state.organizations;

  const [selectedPolicy, setSelectedPolicy] = useState<AllocationPolicy>(policies[0] || {} as AllocationPolicy);
  const [editingRules, setEditingRules] = useState<{ orgId: string; percentage: number }[]>(
    policies[0]?.rules ? policies[0].rules.map(r => ({ ...r })) : []
  );
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync when selected policy changes
  useEffect(() => {
    if (selectedPolicy && selectedPolicy.rules) {
      setEditingRules(selectedPolicy.rules.map(r => ({ ...r })));
      setIsEditing(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [selectedPolicy.id]);

  const currentTotalPercentage = Math.round(
    editingRules.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0) * 100
  ) / 100;
  
  const differenceTo100 = Math.round((100.0 - currentTotalPercentage) * 100) / 100;
  const is100Percent = Math.abs(currentTotalPercentage - 100.0) < 0.01;

  const handleSelectPolicy = (p: AllocationPolicy) => {
    setSelectedPolicy(p);
  };

  const handlePercentageChange = (orgId: string, value: number) => {
    if (!isAdmin) return;
    const cleanValue = isNaN(value) ? 0 : Math.max(0, Math.min(100, Math.round(value * 100) / 100));
    setEditingRules((prev) =>
      prev.map((r) => (r.orgId === orgId ? { ...r, percentage: cleanValue } : r))
    );
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Smart helper to balance remaining percentage to a specific organization
  const handleAutoBalance = (targetOrgId: string) => {
    if (!isAdmin) return;
    setEditingRules((prev) => {
      const otherTotal = prev
        .filter((r) => r.orgId !== targetOrgId)
        .reduce((sum, r) => sum + (r.percentage || 0), 0);
      const remaining = Math.max(0, Math.round((100 - otherTotal) * 100) / 100);
      return prev.map((r) => (r.orgId === targetOrgId ? { ...r, percentage: remaining } : r));
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleStartEditing = () => {
    if (!isAdmin) {
      alert('Access Restricted: Only System Administrators have permission to adjust shared expense allocation policies.');
      return;
    }
    setIsEditing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSavePolicy = () => {
    if (!isAdmin) {
      setErrorMessage('Permission Denied: Only System Administrators can save allocation policy changes.');
      return;
    }

    if (!is100Percent) {
      setErrorMessage(`Validation Error: Policy rule percentages sum to ${currentTotalPercentage}%. They must equal exactly 100.0% (Difference: ${differenceTo100 > 0 ? '+' : ''}${differenceTo100}%).`);
      return;
    }

    const result = storageService.updateAllocationPolicy(selectedPolicy.id, {
      rules: editingRules,
      effectiveDate: new Date().toISOString().split('T')[0],
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to save allocation policy.');
      return;
    }

    // Update local selectedPolicy reference
    setSelectedPolicy((prev) => ({
      ...prev,
      rules: editingRules.map(r => ({ ...r })),
      effectiveDate: new Date().toISOString().split('T')[0],
    }));

    setIsEditing(false);
    setErrorMessage(null);
    setSuccessMessage(`Allocation policy "${selectedPolicy.name}" updated successfully! All future facility expenses under this policy will calculate using the saved proportions.`);
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
          {isAdmin ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Admin Policy Editing Enabled</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Read-Only Policy View</span>
            </div>
          )}
        </div>
      </div>

      {/* Role-Based Notification Bar */}
      {!isAdmin && (
        <div className="bg-[#EBF3FA] border border-[#0F4C81]/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-[#0F4C81]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#0F4C81] shrink-0" />
            <span>
              <strong>Access Policy:</strong> Only <strong>System Administrators</strong> can modify allocation percentages and save policy formula revisions.
            </span>
          </div>
          <span className="font-semibold text-[11px] bg-white/80 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
            Role: {currentUser?.role || 'Staff'}
          </span>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

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
                  onClick={handleStartEditing}
                  disabled={!isAdmin}
                  title={isAdmin ? 'Adjust allocation percentages' : 'Administrator privilege required'}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto ${
                    isAdmin
                      ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer'
                      : 'text-slate-400 bg-slate-100 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isAdmin ? <Edit3 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{isAdmin ? 'Adjust Percentages' : 'Admin Only'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRules(selectedPolicy.rules.map(r => ({ ...r })));
                      setIsEditing(false);
                      setErrorMessage(null);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePolicy}
                    disabled={!is100Percent}
                    className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs transition-colors cursor-pointer ${
                      is100Percent ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cannot Save Allocation Policy</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Validation Banner */}
            <DiscrepancyBanner
              isBalanced={is100Percent}
              difference={Math.abs(differenceTo100)}
              moduleName="Policy Allocation Rules"
              message={
                is100Percent
                  ? `Rules strictly total 100.0%. All shared expenses under this policy will distribute with zero variance.`
                  : `Policy rule percentages sum to ${currentTotalPercentage}%. Must equal exactly 100.0% (Remaining: ${differenceTo100 > 0 ? '+' : ''}${differenceTo100}%).`
              }
            />

            {/* Rules Adjuster Sliders & Inputs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">Resident Organization Distribution Proportions:</p>
                {isEditing && !is100Percent && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Total: {currentTotalPercentage}% (Needs 100.0%)
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {editingRules.map((rule) => {
                  const org = organizations.find((o) => o.id === rule.orgId);
                  const sampleExpense = 1000000; // 1M RWF
                  const sampleShare = Math.round(sampleExpense * ((rule.percentage || 0) / 100));

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
                              disabled={!isEditing || !isAdmin}
                              value={rule.percentage}
                              onChange={(e) =>
                                handlePercentageChange(rule.orgId, parseFloat(e.target.value))
                              }
                              className={`w-20 p-1 text-center font-bold text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                                isEditing 
                                  ? 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20' 
                                  : 'border-transparent bg-transparent'
                              }`}
                            />
                            <span className="text-slate-500 font-bold">%</span>
                          </div>

                          {/* Quick Auto-Fill / Auto-Balance remaining button */}
                          {isEditing && isAdmin && !is100Percent && (
                            <button
                              type="button"
                              onClick={() => handleAutoBalance(rule.orgId)}
                              title="Auto-adjust this organization to make total equal 100%"
                              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              Auto-Balance
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Visual Range Slider */}
                      {isEditing && (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.1"
                          disabled={!isAdmin}
                          value={rule.percentage}
                          onChange={(e) =>
                            handlePercentageChange(rule.orgId, parseFloat(e.target.value))
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
