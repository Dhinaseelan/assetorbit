import React from 'react';
import { useAuth } from '../context/AuthContext';
import { canAccessPage, can, Role } from '../config/rbac';
import {
  LayoutDashboard,
  HardDrive,
  Users,
  Wrench,
  LifeBuoy,
  History,
  Laptop,
  Shield,
  UserCog
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ROLE_META: Record<Role, { label: string; description: string; color: string; badge: string }> = {
  ADMIN:    { label: 'System Admin',  description: 'Full control over all assets, users & settings.',   color: 'bg-purple-100 text-purple-700 border-purple-200', badge: 'bg-purple-600' },
  IT_DEPT:  { label: 'IT Department', description: 'Hardware lifecycle, maintenance & audit operations.', color: 'bg-blue-100 text-blue-700 border-blue-200',   badge: 'bg-blue-600' },
  HR_DEPT:  { label: 'HR Department', description: 'Onboarding assignments & employee account creation.', color: 'bg-pink-100 text-pink-700 border-pink-200',   badge: 'bg-pink-600' },
  MANAGER:  { label: 'Manager',       description: 'Read-only analytics, inventory & audit reporting.', color: 'bg-amber-100 text-amber-700 border-amber-200', badge: 'bg-amber-600' },
  EMPLOYEE: { label: 'Employee',      description: 'View your assigned equipment & file service tickets.', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', badge: 'bg-emerald-600' },
};

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'assets',      label: 'Asset Repository', icon: HardDrive },
  { id: 'assignments', label: 'Custody & Chain',  icon: Users },
  { id: 'maintenance', label: 'Maintenance Log',  icon: Wrench },
  { id: 'tickets',     label: 'Support Tickets',  icon: LifeBuoy },
  { id: 'audit',       label: 'Audit Trail',      icon: History },
  { id: 'my-portal',   label: 'My Equipment',     icon: Laptop },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const role = (user?.role || 'EMPLOYEE') as Role;
  const meta = ROLE_META[role];

  const visibleNav = NAV_ITEMS.filter(item => canAccessPage(role, item.id));

  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
          Navigation
        </p>
        <nav className="space-y-0.5">
          {visibleNav.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Identity Card */}
      <div className="space-y-2">
        {/* Quick Permissions Summary */}
        <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Permissions</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { label: 'Create Asset', action: 'asset_create' as const },
              { label: 'Assign',       action: 'assign_checkout' as const },
              { label: 'Maintenance',  action: 'maintenance_log' as const },
              { label: 'Audit Log',    action: 'audit_view' as const },
              { label: 'Manage Users', action: 'user_create' as const },
              { label: 'Retire Asset', action: 'asset_retire' as const },
            ].map(({ label, action }) => {
              const allowed = can(role, action);
              return (
                <div key={label} className={`flex items-center space-x-1.5 text-[10px] font-medium ${allowed ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${allowed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Badge */}
        <div className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl border ${meta.color}`}>
          <Shield className="h-4 w-4 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-bold">{meta.label}</p>
            <p className="text-[10px] leading-tight opacity-75 font-medium">{meta.description}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
