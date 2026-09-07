import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Boxes, LogIn, Building2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC<{ onGoToRegister: () => void }> = ({ onGoToRegister }) => {
  const { login } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password, companyName);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please check your company name, email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Ambient glows */}
      <div className="absolute -top-60 -left-40 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-60 -right-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Boxes className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assetorbit</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Enterprise Asset Management Platform</p>
          </div>
          <div className="flex justify-center">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Secure Multi-Tenant Login</span>
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign In to your Organization</h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">Enter your company name, work email and password</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Company Name
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Want to onboard your company?{' '}
              <button
                onClick={onGoToRegister}
                className="text-brand-600 hover:text-brand-700 font-bold transition-colors"
              >
                Register your company →
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 font-medium">
          Employees are added by your organization admin. Contact your IT department for access.
        </p>
      </div>
    </div>
  );
};
