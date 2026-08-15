import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { TestSuiteService } from '../../services/testSuiteService';
import { TestResultItem } from '../../types/financial';
import { Play, CheckCircle2, XCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge } from '../common/Badge';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ isOpen, onClose }) => {
  const [tests, setTests] = useState<TestResultItem[]>(() => TestSuiteService.runAllTests());
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = TestSuiteService.runAllTests();
      setTests(results);
      setIsRunning(false);
    }, 400);
  };

  const passCount = tests.filter((t) => t.status === 'PASS').length;
  const failCount = tests.filter((t) => t.status === 'FAIL').length;
  const totalCount = tests.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automated Financial Calculation & Reconciliation Test Suite"
      subtitle="Mandatory system tests verifying double-entry arithmetic, shared allocations, budget variances, and trial balances."
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>
              Passed: <strong className="text-emerald-700">{passCount}</strong> / {totalCount}
            </span>
            {failCount > 0 && (
              <span className="text-rose-700 font-bold">
                • Failed: {failCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleRunTests}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Re-Run All 12 Tests'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Score banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          failCount === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${failCount === 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">
                {failCount === 0 ? 'All 12 Financial Calculations Passed Verification' : `${failCount} Test(s) Require Attention`}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                Verifies normalized frequencies, allocation reconciliation, zero-safe budgets, double-entry GL balance, and 3-year escalation formulas.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-black">{Math.round((passCount / totalCount) * 100)}%</span>
            <p className="text-[10px] font-semibold uppercase tracking-wider">Integrity Score</p>
          </div>
        </div>

        {/* Test list */}
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {tests.map((test) => (
            <div key={test.id} className="p-3.5 bg-white hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                {test.status === 'PASS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{test.name}</span>
                    <Badge variant={test.category === 'Accounting' ? 'purple' : test.category === 'Reconciliation' ? 'info' : 'neutral'} size="sm">
                      {test.category}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{test.description}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px]">
                    <span className="text-slate-600">
                      Expected: <strong className="text-slate-800">{test.expected}</strong>
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">
                      Actual: <strong className={test.status === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>{test.actual}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <Badge variant={test.status === 'PASS' ? 'success' : 'danger'} size="sm">
                  {test.status}
                </Badge>
                <p className="text-[10px] text-slate-400 mt-1">{test.executionTimeMs}ms</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
