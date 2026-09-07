import React from 'react';
import { Asset } from '../types';
import {
  ShoppingCart,
  PlusCircle,
  UserCheck,
  Activity,
  Wrench,
  RotateCcw,
  Archive,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface LifecycleStepperProps {
  asset: Asset;
}

export const LifecycleStepper: React.FC<LifecycleStepperProps> = ({ asset }) => {
  const steps = [
    { num: 1, title: 'Purchase Asset', desc: `$${asset.purchaseCost} on ${new Date(asset.purchaseDate).toLocaleDateString()}`, icon: ShoppingCart },
    { num: 2, title: 'Registered in System', desc: `Tag: ${asset.assetTag}`, icon: PlusCircle },
    { num: 3, title: 'Assign to Employee', desc: asset.currentAssignee ? `Assigned to ${asset.currentAssignee.name}` : 'Unassigned', icon: UserCheck },
    { num: 4, title: 'Track Usage & Condition', desc: `Condition: ${asset.condition}`, icon: Activity },
    { num: 5, title: 'Maintenance & Servicing', desc: asset.status === 'Maintenance' ? 'Currently in Service' : `${asset._count?.maintenance || 0} Past Repairs`, icon: Wrench },
    { num: 6, title: 'Return Asset', desc: asset.status === 'Available' && asset.currentAssignee === null ? 'Returned to Stock' : 'Active Assignment', icon: RotateCcw },
    { num: 7, title: 'Retire (End of Life)', desc: asset.status === 'Retired' ? 'Retired / Scrapped' : `Expected Lifespan: ${asset.expectedYears} yrs`, icon: Archive },
  ];

  // Determine current active step based on asset status
  let activeStep = 4; // default in-use
  if (asset.status === 'Available' && !asset.currentAssignee) activeStep = 2;
  if (asset.status === 'Assigned') activeStep = 4;
  if (asset.status === 'Maintenance') activeStep = 5;
  if (asset.status === 'Retired') activeStep = 7;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <span>7-Stage Asset Lifecycle Progress</span>
            <span className="text-xs font-normal text-brand-400 font-mono">({asset.assetTag})</span>
          </h4>
          <p className="text-xs text-slate-400">Standard EAM workflow chain for {asset.name}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          asset.status === 'Assigned' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
          asset.status === 'Available' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
          asset.status === 'Maintenance' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
          'bg-slate-700 text-slate-300'
        }`}>
          Status: {asset.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 pt-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = step.num < activeStep || (step.num === 7 && asset.status === 'Retired');
          const isCurrent = step.num === activeStep && asset.status !== 'Retired';

          return (
            <div
              key={step.num}
              className={`relative flex flex-col p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-brand-600/15 border-brand-500/50 text-white shadow-lg shadow-brand-500/10'
                  : isCompleted
                  ? 'bg-slate-850/70 border-slate-800 text-slate-300'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                  isCurrent ? 'bg-brand-500 text-white' : isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <Clock className="h-3.5 w-3.5 text-brand-400 animate-spin" />
                ) : null}
              </div>

              <p className="text-[11px] font-bold leading-tight mb-1">{step.num}. {step.title}</p>
              <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
