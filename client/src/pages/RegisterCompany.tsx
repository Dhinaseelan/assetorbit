import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Boxes, Building2, ShieldCheck, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const RegisterCompany: React.FC<{ onGoToLogin: () => void }> = ({ onGoToLogin }) => {
  const { login } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Register the org + admin user via API (does not auto-login)
      await api.post('/auth/register-org', { companyName, name: adminName, email: adminEmail, password });
      setSuccess(true);
      // Auto-login after a brief pause so the user sees the confirmation screen
      setTimeout(() => {
        login(adminEmail, password, companyName).catch(() => onGoToLogin());
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-full max-w-md text-center space-y-5 z-10">
          <div className="h-20 w-20 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Company Registered!</h2>
            <p className="text-slate-600 text-sm mt-2 font-medium">
              <span className="text-brand-600 font-bold">{companyName}</span> has been onboarded successfully.
              You are now logged in as Admin.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-left space-y-2 shadow-xs">
            <p className="text-xs font-bold text-slate-800 mb-3">Your Organization Details</p>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500">Company:</span>
              <span className="text-slate-900 font-bold">{companyName}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500">Admin:</span>
              <span className="text-slate-900 font-bold">{adminName}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-900 font-mono font-bold">{adminEmail}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium">Redirecting you to the dashboard automatically...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Ambient glows */}
      <div className="absolute -top-60 -right-40 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-60 -left-40 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Building2 className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Register Company</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Onboard your organization to Assetorbit</p>
          </div>
          <div className="flex justify-center">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Isolated Tenant Workspace</span>
            </span>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Create your organization</h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">The first account will be the Admin for your workspace</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all font-medium"
                />
              </div>
            </div>

            {/* Admin Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="John Smith"
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all font-medium"
              />
            </div>

            {/* Admin Work Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Work Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="admin@yourcompany.com"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all font-medium"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-brand-600/25 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Organization...</span>
                </>
              ) : (
                <>
                  <Boxes className="h-4 w-4" />
                  <span>Register Company</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              onClick={onGoToLogin}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-bold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 font-medium mt-4">
          By registering, you agree to Assetorbit's Terms of Service. Each company gets a fully isolated private tenant.
        </p>
      </div>
    </div>
  );
};
