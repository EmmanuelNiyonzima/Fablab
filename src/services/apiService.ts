/**
 * FabLab Rwanda Real Full-Stack Backend API Client
 * Proxies state updates directly to PostgreSQL Cloud SQL Database
 */

import { 
  Organization, 
  Account, 
  AllocationPolicy, 
  SharedExpense, 
  ExpenseTransaction, 
  IncomeTransaction, 
  JournalEntry, 
  Contribution, 
  BudgetLine, 
  ForecastAssumption, 
  User, 
  AuditLog, 
  SystemSettings 
} from '../types/financial';

const API_BASE = '/api/v1';

export class ApiService {
  private static getHeaders() {
    const token = localStorage.getItem('fablab_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  static async fetchDashboardSummary() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard summary');
      return await res.json();
    } catch (e) {
      console.warn('Backend API fetch warning, fallback active:', e);
      return null;
    }
  }

  static async fetchOrganizations(): Promise<Organization[]> {
    const res = await fetch(`${API_BASE}/organizations`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch organizations');
    return await res.json();
  }

  static async fetchAccounts(): Promise<Account[]> {
    const res = await fetch(`${API_BASE}/accounts`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return await res.json();
  }

  static async fetchExpenses(): Promise<ExpenseTransaction[]> {
    const res = await fetch(`${API_BASE}/expenses`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return await res.json();
  }

  static async createExpense(expenseData: Partial<ExpenseTransaction>): Promise<ExpenseTransaction> {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(expenseData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create expense on backend');
    }
    return await res.json();
  }

  static async postExpense(expenseId: string) {
    const res = await fetch(`${API_BASE}/expenses/${expenseId}/post`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to post expense to General Ledger');
    }
    return await res.json();
  }

  static async fetchIncome(): Promise<IncomeTransaction[]> {
    const res = await fetch(`${API_BASE}/income`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch income');
    return await res.json();
  }

  static async createIncome(incomeData: Partial<IncomeTransaction>): Promise<IncomeTransaction> {
    const res = await fetch(`${API_BASE}/income`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(incomeData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record income on backend');
    }
    return await res.json();
  }

  static async fetchGeneralLedger(accountCode?: string) {
    const query = accountCode ? `?accountCode=${encodeURIComponent(accountCode)}` : '';
    const res = await fetch(`${API_BASE}/reports/general-ledger${query}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch General Ledger');
    return await res.json();
  }

  static async fetchTrialBalance() {
    const res = await fetch(`${API_BASE}/reports/trial-balance`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch Trial Balance');
    return await res.json();
  }

  static async fetchIncomeStatement() {
    const res = await fetch(`${API_BASE}/reports/income-statement`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch Income Statement');
    return await res.json();
  }

  static async fetchSharedExpenses(): Promise<SharedExpense[]> {
    const res = await fetch(`${API_BASE}/shared-expenses`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch shared expenses');
    return await res.json();
  }

  static async fetchContributions(): Promise<Contribution[]> {
    const res = await fetch(`${API_BASE}/contributions`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch contributions');
    return await res.json();
  }

  static async fetchBudgets(): Promise<BudgetLine[]> {
    const res = await fetch(`${API_BASE}/budgets`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return await res.json();
  }

  static async fetchAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit-logs`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return await res.json();
  }

  static async runSystemTestSuite() {
    const res = await fetch(`${API_BASE}/system/test-suite`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to execute system test suite');
    return await res.json();
  }
}
