import { 
  User, 
  Organization, 
  SharedExpense, 
  Contribution, 
  ExpenseTransaction, 
  IncomeTransaction, 
  OrgAllocationResult 
} from '../types/financial';
import { DatabaseState } from '../services/storageService';

/**
 * Security Scope & Department Data Isolation Utility
 * 
 * Rules:
 * 1. Super Administrator (Emmanuel Niyonzima, role: 'ADMIN') has complete 360-degree
 *    visibility across all resident organizations, submissions, contributions, and master financials.
 * 2. Department users (e.g. FabLab, kLab, Fab Cafe, 250Startups) can ONLY view and access:
 *    - Shared facility expenses with their own department's allocated share (other departments' 
 *      confidential breakdowns are redacted).
 *    - Expenses submitted exclusively by their department.
 *    - Contributions, billings, and arrears belonging exclusively to their department.
 *    - Direct income/expenses tagged to their department.
 *    - Submitting shared expenses is strictly locked to their own organization.
 */

export class SecurityScope {
  /**
   * Checks if user is Super Administrator (Full Cross-Department Visibility)
   */
  static isSuperAdmin(user?: User | null): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.email?.toLowerCase().includes('niyonzimaemmanuel85@gmail.com')) return true;
    return false;
  }

  /**
   * Checks if user belongs to 250Startups
   */
  static is250Startups(user?: User | null): boolean {
    if (!user) return false;
    return (
      user.organizationId === 'org-250startups' ||
      user.organizationName?.toLowerCase().includes('250startups') ||
      user.email?.toLowerCase().includes('250startups')
    );
  }

  /**
   * Checks if user has access to advanced executive accounting, budgets, forecasts, and financial statements:
   * Accessible ONLY to Super Administrator (Emmanuel Niyonzima) and 250Startups.
   * Hidden for all other departments (Fablab, kLab, Fab Cafe) to keep their UI distraction-free.
   */
  static canAccessAdvancedFinancials(user?: User | null): boolean {
    if (this.isSuperAdmin(user)) return true;
    if (this.is250Startups(user)) return true;
    return false;
  }

  /**
   * Checks if user can access the Audit Trail
   */
  static canAccessAuditTrail(user?: User | null): boolean {
    if (this.isSuperAdmin(user)) return true;
    if (this.is250Startups(user)) return true;
    return false;
  }

  /**
   * Get user's active organization ID if department-restricted
   */
  static getUserOrgId(user?: User | null): string | undefined {
    if (!user) return undefined;
    return user.organizationId;
  }

  /**
   * Get user's active organization object
   */
  static getUserOrg(user?: User | null, organizations: Organization[] = []): Organization | undefined {
    if (!user || !user.organizationId) return undefined;
    return organizations.find((o) => o.id === user.organizationId);
  }

  /**
   * Filter Shared Expenses for the active user:
   * - Superadmin: All shared expenses (all departments, pending, approved, rejected).
   * - Department User: 
   *    1) Submissions made by their own department (any status: draft, submitted, approved, rejected).
   *    2) Approved/Posted general facility master expenses where their department has an allocation share.
   *    3) STRICTLY HIDE other departments' private submissions or rejections.
   */
  static filterSharedExpenses(expenses: SharedExpense[], user?: User | null): SharedExpense[] {
    if (this.isSuperAdmin(user)) {
      return expenses;
    }

    const orgId = this.getUserOrgId(user);
    if (!orgId) {
      // If user has no assigned org and is not admin, fallback to safe restricted set
      return expenses.filter(
        (e) => e.status === 'Posted' || e.status === 'Approved'
      );
    }

    return expenses.filter((exp) => {
      // 1. If submitted by this department (or created by this user), always visible with full status
      const isMyOrgSubmission = exp.submittedByOrgId === orgId;
      const isMyUserCreation = exp.createdBy === user?.name || exp.submittedByEmail === user?.email;
      if (isMyOrgSubmission || isMyUserCreation) {
        return true;
      }

      // 2. If approved / posted facility master expense apportioned to this org
      const isApprovedFacilityExpense = (exp.status === 'Posted' || exp.status === 'Approved');
      const isAllocatedToMyOrg = exp.allocations?.some((a) => a.orgId === orgId && a.percentage > 0);

      if (isApprovedFacilityExpense && isAllocatedToMyOrg) {
        return true;
      }

      // 3. Any other department's pending submissions or private rejected drafts are hidden
      return false;
    });
  }

  /**
   * Redact / Sanitize Allocation Matrix for Department Users:
   * Replaces other departments' allocation amounts with masked confidentiality badges
   * while preserving the viewer's own department exact numbers and overall total.
   */
  static sanitizeAllocationsForUser(
    allocations: OrgAllocationResult[], 
    user?: User | null
  ): OrgAllocationResult[] {
    if (this.isSuperAdmin(user)) {
      return allocations;
    }

    const orgId = this.getUserOrgId(user);
    return allocations.map((alloc) => {
      if (alloc.orgId === orgId) {
        return alloc;
      }
      // Redact other org specific private monthly and amount figures
      return {
        ...alloc,
        orgName: `${alloc.orgName.split(' ')[0]} (Confidential)`,
        amount: 0,
        monthlyShare: 0,
      };
    });
  }

  /**
   * Filter Contributions for the active user:
   * - Superadmin: All organizations.
   * - Department User: ONLY their own department contributions.
   */
  static filterContributions(contributions: Contribution[], user?: User | null): Contribution[] {
    if (this.isSuperAdmin(user)) {
      return contributions;
    }

    const orgId = this.getUserOrgId(user);
    if (!orgId) return [];

    return contributions.filter((c) => c.orgId === orgId);
  }

  /**
   * Filter Direct Expenses:
   */
  static filterExpenseTransactions(
    expenses: ExpenseTransaction[], 
    user?: User | null
  ): ExpenseTransaction[] {
    if (this.isSuperAdmin(user)) {
      return expenses;
    }

    const orgId = this.getUserOrgId(user);
    return expenses.filter((e) => {
      if (e.organizationId) {
        return e.organizationId === orgId;
      }
      // If general non-specific expense, allow approved viewing
      return e.status === 'Approved' || e.status === 'Posted';
    });
  }

  /**
   * Filter Direct Income:
   */
  static filterIncomeTransactions(
    incomes: IncomeTransaction[], 
    user?: User | null
  ): IncomeTransaction[] {
    if (this.isSuperAdmin(user)) {
      return incomes;
    }

    const orgId = this.getUserOrgId(user);
    return incomes.filter((i) => {
      if (i.organizationId) {
        return i.organizationId === orgId;
      }
      return i.status === 'Approved' || i.status === 'Posted';
    });
  }
}
