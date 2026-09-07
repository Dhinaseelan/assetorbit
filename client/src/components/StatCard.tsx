import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'brand' | 'emerald' | 'amber' | 'purple' | 'rose' | 'blue';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'brand'
}) => {
  const iconBgMap = {
    brand: 'bg-brand-50 text-brand-600 border border-brand-200',
    emerald: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border border-amber-200',
    purple: 'bg-purple-50 text-purple-600 border border-purple-200',
    rose: 'bg-rose-50 text-rose-600 border border-rose-200',
    blue: 'bg-sky-50 text-sky-600 border border-sky-200',
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 transition-all hover:shadow-md hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl ${iconBgMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};
