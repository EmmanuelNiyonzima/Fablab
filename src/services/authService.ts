import { User, UserRole } from '../types/financial';
import { storageService } from './storageService';

const TOKEN_STORAGE_KEY = 'fablab_auth_session_token';
const REMEMBER_ME_KEY = 'fablab_auth_remember_me';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  permissions: string[];
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private token: string | null = null;
  private currentUser: User | null = null;
  private permissions: string[] = [];
  private listeners: ((state: AuthState) => void)[] = [];
  private isLoading = true;

  constructor() {
    this.initSession();
  }

  private async initSession() {
    this.isLoading = true;
    const storedToken =
      sessionStorage.getItem(TOKEN_STORAGE_KEY) ||
      localStorage.getItem(TOKEN_STORAGE_KEY);

    if (storedToken) {
      this.token = storedToken;
      try {
        const response = await fetch('/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.currentUser = data.user;
          this.permissions = data.user.permissions || [];
          if (this.currentUser) {
            storageService.setCurrentUser(this.currentUser);
          }
        } else {
          // Token invalid or expired
          this.clearSession(false);
          storageService.logAudit(
            'SESSION_EXPIRED',
            'Authentication',
            'session-token',
            undefined,
            'Previous session expired'
          );
        }
      } catch (err) {
        console.warn('Backend session verification fallback:', err);
      }
    }

    this.isLoading = false;
    this.notify();
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getState(): AuthState {
    return {
      isAuthenticated: !!this.token && !!this.currentUser,
      user: this.currentUser,
      permissions: this.permissions,
      isLoading: this.isLoading,
      error: null,
    };
  }

  public getAuthToken(): string | null {
    return this.token;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  public hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'ADMIN') return true;
    return this.permissions.includes(permission);
  }

  public async login(
    email: string,
    password: string,
    rememberMe = false
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        storageService.logAudit(
          'LOGIN_FAILED',
          'Authentication',
          email,
          undefined,
          `Failed login attempt for ${email}`
        );
        return {
          success: false,
          error: data.error || 'Incorrect email or password. Please try again.',
        };
      }

      // Store token safely
      this.token = data.token;
      this.currentUser = data.user;
      this.permissions = data.user.permissions || [];

      if (rememberMe) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      // Sync user to storageService
      if (this.currentUser) {
        storageService.setCurrentUser(this.currentUser);
      }

      storageService.logAudit(
        'LOGIN_SUCCESS',
        'Authentication',
        this.currentUser?.id || 'usr',
        undefined,
        `User ${this.currentUser?.name} (${this.currentUser?.role}) signed in successfully`
      );

      this.notify();
      return { success: true, user: this.currentUser };
    } catch (err: any) {
      console.error('Login error:', err);
      return {
        success: false,
        error: 'Unable to connect to financial auth core. Please check network connection.',
      };
    }
  }

  public async logout(): Promise<void> {
    const userEmail = this.currentUser?.email || 'user';
    try {
      if (this.token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      storageService.logAudit(
        'LOGOUT',
        'Authentication',
        this.currentUser?.id || 'usr',
        undefined,
        `User ${this.currentUser?.name || userEmail} signed out of session`
      );
      this.clearSession(true);
    }
  }

  public async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      storageService.logAudit(
        'PASSWORD_RESET_REQUESTED',
        'Authentication',
        email,
        undefined,
        `Password recovery dispatched for ${email}`
      );

      return {
        success: true,
        message:
          data.message ||
          'If an account exists for this email, you will receive instructions to reset your password.',
      };
    } catch {
      return {
        success: true,
        message:
          'If an account exists for this email, you will receive instructions to reset your password.',
      };
    }
  }

  private clearSession(notifyListeners = true) {
    this.token = null;
    this.currentUser = null;
    this.permissions = [];
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    if (notifyListeners) {
      this.notify();
    }
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }
}

export const authService = new AuthService();
