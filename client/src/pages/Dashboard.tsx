import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DashboardStats, Asset } from '../types';
import { StatCard } from '../components/StatCard';
import { CreateEmployeeForm } from '../components/CreateEmployeeForm';
import { useAuth } from '../context/AuthContext';
import { useRefresh } from '../App';
import { can, Role } from '../config/rbac';
import {
  HardDrive,
  UserCheck,
  Wrench,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  LifeBuoy,
  History,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectAsset: (asset: Asset) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab, onSelectAsset }) => {
  const { user } = useAuth();
  const { refreshSignal } = useRefresh();
  const role = (user?.role || 'EMPLOYEE') as Role;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [refreshSignal]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center space-x-3 text-slate-400">
        <div className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Computing system metrics...</span>
      </div>
    );
  }

  if (!stats) return null;

  const { summary, statusStats, categoryStats, expiringWarranties, recentActivity } = stats;

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-600 via-brand-700 to-blue-700 text-white shadow-md">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            System Analytics & Overview
          </h1>
          <p className="text-xs text-brand-100 mt-1 max-w-xl font-medium">
            Real-time lifecycle tracking, financial valuation, maintenance schedules, and active warranty monitoring across enterprise hardware assets.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('assets')}
            className="px-4 py-2.5 rounded-xl bg-white text-brand-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-md flex items-center space-x-2"
          >
            <span>View Asset Repository</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Hardware Inventory"
          value={summary.totalAssets}
          subtitle={`${summary.availableAssets} Available | ${summary.assignedAssets} Assigned`}
          icon={HardDrive}
          color="brand"
        />
        <StatCard
          title="Total Purchase Value"
          value={`$${summary.totalPurchaseValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Initial Procurement Investment"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Current Depreciated Value"
          value={`$${summary.currentBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Straight-Line Book Valuation"
          icon={TrendingDown}
          color="emerald"
        />
        <StatCard
          title="In Maintenance / Service"
          value={summary.maintenanceAssets}
          subtitle={`$${summary.totalMaintenanceSpend.toLocaleString()} Total Repair Spend`}
          icon={Wrench}
          color="amber"
        />
      </div>

      {/* Warranty Expiry Warning Banner (If Any) */}
      {expiringWarranties.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 mt-0.5">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Warranty Expiration Warning ({expiringWarranties.length} Assets Flagged)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                The following hardware warranties expire within 90 days. Schedule vendor extensions or replacements to avoid financial loss.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('assets')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold whitespace-nowrap self-start md:self-auto shadow-xs"
          >
            Inspect Warranties
          </button>
        </div>
      )}

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Asset Status Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusStats}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {statusStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {statusStats.map(st => (
              <div key={st.status} className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                <span className="text-slate-600 font-medium">{st.status}:</span>
                <span className="font-bold text-slate-900">{st.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Category Volume & Valuation</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats}>
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity & Audit Trail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Assets Detail List */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>Assets Expiring Soon</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">Next 90 Days</span>
          </div>

          <div className="space-y-2.5">
            {expiringWarranties.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No hardware warranties expiring soon.</p>
            ) : (
              expiringWarranties.map(asset => (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset(asset)}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {asset.assetTag}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{asset.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Serial: {asset.serialNumber} • {asset.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-600">
                      {new Date(asset.warrantyExpiry).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-slate-400">Expiry Date</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Stream */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <History className="h-4 w-4 text-brand-600" />
              <span>Audit Trail Activity Stream</span>
            </h3>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View All Logs
            </button>
          </div>

          <div className="space-y-2.5">
            {recentActivity.map(log => (
              <div key={log.id} className="flex items-start space-x-3 text-xs">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-brand-700 border border-slate-200 mt-0.5">
                  {log.action.replace('ASSET_', '')}
                </span>
                <div className="flex-1">
                  <p className="text-slate-800 text-xs font-medium leading-snug">{log.details}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Role: {log.userRole} • {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin / HR: Employee Management Section */}
      {can(role, 'user_create') && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CreateEmployeeForm onSuccess={() => {}} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Access Control Policy</h3>
              <p className="text-xs text-slate-500 mb-4 font-medium">How employee accounts work in Assetorbit</p>
              <div className="space-y-2.5">
                {[
                  { color: 'bg-purple-100 text-purple-600', title: 'Employees cannot self-register', desc: 'Only Admins and HR Dept can create accounts for team members.' },
                  { color: 'bg-blue-100 text-blue-600',   title: 'Tenant-isolated workspace',     desc: 'Each account is bound to your organization and cannot access other company data.' },
                  { color: 'bg-emerald-100 text-emerald-600', title: 'Temporary password flow',   desc: 'Share the temporary password securely. Employees use it for first login.' },
                  { color: 'bg-brand-100 text-brand-600', title: 'Role-based access control',     desc: 'Assign the appropriate role to limit access to relevant features.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className={`h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${item.color}`}>
                      <span className="text-xs font-black">{['A', 'T', 'P', 'R'][i]}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
