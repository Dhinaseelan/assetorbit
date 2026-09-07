import React, { useState } from 'react';
import { UserPlus, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import api from '../services/api';

const ROLES = [
  { value: 'ADMIN', label: 'Admin', desc: 'Full system access & configuration' },
  { value: 'IT_DEPT', label: 'IT Department', desc: 'Hardware lifecycle & QR scanning' },
  { value: 'HR_DEPT', label: 'HR Department', desc: 'Employee onboarding & asset checkout' },
  { value: 'MANAGER', label: 'Manager', desc: 'Department-level oversight & reports' },
  { value: 'EMPLOYEE', label: 'Employee', desc: 'Self-service portal & repair tickets' },
];

const DEPARTMENTS = [
  'Engineering', 'Information Technology', 'Human Resources', 'Finance & Accounting',
  'Operations', 'Marketing', 'Sales', 'Legal & Compliance', 'Customer Support',
  'Product Management', 'Design', 'Executive', 'Facilities', 'Other'
];

interface CreateEmployeeFormProps {
  onSuccess?: (employee: any) => void;
}

export const CreateEmployeeForm: React.FC<CreateEmployeeFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [department, setDepartment] = useState('Engineering');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [createdEmployee, setCreatedEmployee] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');
    try {
      const res = await api.post('/users', { name, email, password: tempPassword, role, department });
      setCreatedEmployee(res.data);
      setStatus('success');
      setMessage(`Account created for ${name}`);
      setName(''); setEmail(''); setTempPassword(''); setRole('EMPLOYEE'); setDepartment('Engineering');
      onSuccess?.(res.data);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to create employee account');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === role);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center">
          <UserPlus className="h-4 w-4 text-brand-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Create Employee Account</h3>
          <p className="text-[11px] text-slate-500 font-medium">Add a new team member to your organization</p>
        </div>
      </div>

      {/* Status Banner */}
      {status === 'success' && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-700">{message}</p>
            {createdEmployee && (
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                {createdEmployee.email} · {createdEmployee.role.replace('_', ' ')} · {createdEmployee.department}
              </p>
            )}
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
          <p className="text-xs font-medium text-rose-700">{message}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Section: Identity */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">Identity</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Work Email <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="jane@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-100 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Section: Access */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">Access</p>
          <div className="space-y-3">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Temporary Password <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                value={tempPassword}
                onChange={e => setTempPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-100 transition-all font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Employee will be prompted to change on first login</p>
            </div>

            {/* Role + Department */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Role <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-100 transition-all cursor-pointer"
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                {selectedRole && (
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{selectedRole.desc}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Department <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-100 transition-all cursor-pointer"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-sm shadow-brand-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
