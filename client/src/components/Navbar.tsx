import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  Boxes,
  ShieldCheck,
  Building2,
  LogOut,
  QrCode
} from 'lucide-react';

interface NavbarProps {
  onOpenScanner?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenScanner }) => {
  const { user, logout } = useAuth();

  const roleColors: Record<Role, string> = {
    ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    IT_DEPT: 'bg-blue-100 text-blue-700 border-blue-200',
    HR_DEPT: 'bg-pink-100 text-pink-700 border-pink-200',
    MANAGER: 'bg-amber-100 text-amber-800 border-amber-200',
    EMPLOYEE: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-2.5 min-w-0 shrink-0">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
          <Boxes className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 truncate">
              Assetorbit
            </span>
            <span className="hidden md:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 items-center gap-1 shrink-0">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>SaaS</span>
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-500 font-medium truncate">Enterprise Asset Management Platform</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
        {/* Active Company Tenant Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 max-w-[180px] truncate">
          <Building2 className="h-3.5 w-3.5 text-brand-600 shrink-0" />
          <span className="truncate">{user?.orgName || 'Organization'}</span>
        </div>

        {/* QR Scanner Quick Launch */}
        {onOpenScanner && (
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs"
            title="Scan Asset QR Code"
          >
            <QrCode className="h-4 w-4 text-brand-600" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>
        )}

        {/* User Avatar & Sign Out */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:block text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{user?.name}</p>
              {user?.role && (
                <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded border shrink-0 ${roleColors[user.role]}`}>
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate">{user?.department}</p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-xs"
            title="Sign Out of Assetorbit"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-600" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
