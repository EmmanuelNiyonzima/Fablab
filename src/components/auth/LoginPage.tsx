import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  TrendingUp,
  Building2,
  PieChart,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  Layers
} from 'lucide-react';
import { authService } from '../../services/authService';
import { FabLabLogo } from '../common/FabLabLogo';
import { Button } from '../common/Button';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('niyonzimaemmanuel85@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotIsSubmitting, setForgotIsSubmitting] = useState(false);
  const [forgotFeedbackMessage, setForgotFeedbackMessage] = useState('');

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.login(email.trim(), password, rememberMe);

      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(result.error || 'Incorrect email or password. Please try again.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setForgotFeedbackMessage('Please enter a valid email address.');
      return;
    }

    setForgotIsSubmitting(true);
    try {
      const result = await authService.forgotPassword(forgotEmail.trim());
      setForgotFeedbackMessage(result.message);
    } catch {
      setForgotFeedbackMessage(
        'If an account exists for this email, you will receive instructions to reset your password.'
      );
    } finally {
      setForgotIsSubmitting(false);
    }
  };

  const handleQuickFill = (presetEmail: string) => {
    setEmail(presetEmail);
    setValidationErrors({});
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#0B192C] text-slate-100 flex flex-col justify-between selection:bg-[#009A44] selection:text-white relative overflow-hidden">
      {/* Background Decorative Ambient Circles inspired by FabLab tri-color nodes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-25">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-[#E31B23]/25 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-[460px] h-[460px] bg-[#0F4C81]/35 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-[380px] h-[380px] bg-[#009A44]/25 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-[#0B192C]/90 backdrop-blur-md relative z-10 flex items-center justify-between">
        <FabLabLogo size="md" theme="dark" subtitle="Financial Management System" />

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F4C81]/25 border border-[#0F4C81]/50 text-sky-200 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#009A44] animate-pulse" />
            <span>256-Bit Financial Encryption</span>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT: FabLab Brand Identity & Financial Intelligence */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 text-slate-200">
            <div className="space-y-4">
              <FabLabLogo size="xl" theme="dark" subtitle="" />

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                  FabLab Rwanda <br />
                  <span className="text-[#009A44]">Financial Management System</span>
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed max-w-md pt-1">
                  Powering smarter financial decisions through accurate data and intelligent reporting.
                </p>
              </div>
            </div>

            {/* Financial System Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Shared Facility Budget</span>
                  <Layers className="w-4 h-4 text-[#009A44]" />
                </div>
                <p className="text-lg font-bold text-white font-numeric">53,200,600 RWF</p>
                <p className="text-[11px] text-[#009A44] font-medium">4 Co-Located Organizations</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">General Ledger</span>
                  <TrendingUp className="w-4 h-4 text-[#0F4C81]" />
                </div>
                <p className="text-lg font-bold text-white font-numeric">Zero Variance</p>
                <p className="text-[11px] text-sky-400 font-medium">Double-Entry Audited</p>
              </div>
            </div>

            {/* The 4 Resident Organizations (FabLab, KLab, Fab Cafe, 250Startups) */}
            <div className="pt-1">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                Co-Located Space Organizations:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'Fablab Rwanda', share: '30%' },
                  { name: 'Klab', share: '20%' },
                  { name: 'Fab Cafe', share: '40%' },
                  { name: '250Startups', share: '10%' },
                ].map((org) => (
                  <div
                    key={org.name}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-300 flex items-center justify-between"
                  >
                    <span className="font-semibold">{org.name}</span>
                    <span className="font-numeric text-[11px] text-[#009A44] font-bold">{org.share}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Modern White Login Card */}
          <div className="w-full lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header with FabLab logo */}
              <div className="text-center space-y-2">
                <div className="flex justify-center pb-1">
                  <FabLabLogo size="lg" theme="light" subtitle="" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
                  <p className="text-xs text-slate-500">
                    Sign in to continue to your financial workspace.
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div
                  id="login-error-alert"
                  className="p-3 bg-[#FDF1F1] border border-[#F9BFC1] rounded-xl text-xs text-[#C2141B] font-medium flex items-start gap-2 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 text-[#E31B23] shrink-0 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Email Field */}
                <div className="space-y-1">
                  <label htmlFor="login-email" className="block text-xs font-bold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (validationErrors.email) {
                          setValidationErrors((prev) => ({ ...prev, email: undefined }));
                        }
                      }}
                      placeholder="e.g. niyonzimaemmanuel85@gmail.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                        validationErrors.email
                          ? 'border-[#E31B23] focus:ring-[#E31B23]/30 bg-[#FDF1F1]'
                          : 'border-slate-300 focus:border-[#0F4C81] focus:ring-[#0F4C81]/20'
                      }`}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-[11px] text-[#E31B23] font-medium mt-0.5">
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-semibold text-[#0F4C81] hover:text-[#0A3962] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationErrors.password) {
                          setValidationErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      placeholder="••••••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                        validationErrors.password
                          ? 'border-[#E31B23] focus:ring-[#E31B23]/30 bg-[#FDF1F1]'
                          : 'border-slate-300 focus:border-[#0F4C81] focus:ring-[#0F4C81]/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-[11px] text-[#E31B23] font-medium mt-0.5">
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-sm border-slate-300 text-[#009A44] focus:ring-[#009A44]/30 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-600">Remember me</span>
                  </label>
                </div>

                {/* Primary Sign In Button (FabLab Green) */}
                <Button
                  id="login-submit-button"
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Sign In
                </Button>
              </form>

              {/* Quick Staff Account Switcher for Instant Demo & Testing */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
                  Quick Staff Login Presets
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Administrator', email: 'niyonzimaemmanuel85@gmail.com' },
                    { label: 'Finance Manager', email: 'm.uwera@fablab.rw' },
                    { label: 'Financial Analyst', email: 'p.mugisha@fablab.rw' },
                    { label: 'Senior Accountant', email: 'a.umutoni@fablab.rw' },
                  ].map((staff) => (
                    <button
                      key={staff.email}
                      type="button"
                      onClick={() => handleQuickFill(staff.email)}
                      className="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-[#EBF3FA] hover:text-[#0F4C81] border border-slate-200/80 text-[11px] transition-colors cursor-pointer"
                    >
                      <p className="font-bold truncate">{staff.label}</p>
                      <p className="text-[10px] text-slate-400 truncate">{staff.email}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#EBF3FA] text-[#0F4C81]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Reset Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotFeedbackMessage('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered FabLab email address to receive password reset instructions.
            </p>

            {forgotFeedbackMessage ? (
              <div className="p-3 bg-[#E8F8EE] border border-[#A7E7BF] rounded-xl text-xs text-[#007D37] font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#009A44]" />
                <div className="flex-1">{forgotFeedbackMessage}</div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. niyonzimaemmanuel85@gmail.com"
                    required
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20 outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotFeedbackMessage('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={forgotIsSubmitting}
                  >
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-800 text-center text-xs text-slate-400 relative z-10">
        <p>© 2026 FabLab Rwanda. Telecom House, 6th Floor, Boulevard de l'Umuganda, Kacyiru, Kigali.</p>
      </footer>
    </div>
  );
};
