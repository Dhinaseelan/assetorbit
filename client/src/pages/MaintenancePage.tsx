import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MaintenanceRecord } from '../types';
import { useRefresh } from '../App';
import { Wrench, CheckCircle2, DollarSign } from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const { refreshSignal } = useRefresh();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/maintenance');
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch maintenance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [refreshSignal]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/maintenance/${id}/status`, { status: newStatus });
      fetchRecords();
    } catch (err) {
      alert('Failed to update maintenance status');
    }
  };

  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-amber-400" />
            <span>Maintenance & Repair Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track service histories, vendor repair expenses, and hardware maintenance status.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3">
          <DollarSign className="h-5 w-5 text-amber-400" />
          <div>
            <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Total Servicing Expenditure</p>
            <p className="text-base font-extrabold text-white">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 uppercase tracking-wider text-[10px] text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">Asset</th>
                <th className="py-3.5 px-4">Serviced By / Vendor</th>
                <th className="py-3.5 px-4">Service Description</th>
                <th className="py-3.5 px-4">Cost ($USD)</th>
                <th className="py-3.5 px-4">Service Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading maintenance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No servicing or repair records logged.
                  </td>
                </tr>
              ) : (
                records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{rec.asset?.name || 'Asset'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Tag: {rec.asset?.assetTag}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {rec.performedBy}
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-xs">
                      {rec.description}
                    </td>

                    <td className="py-3 px-4 font-bold text-white">
                      ${rec.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        rec.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        rec.status === 'In_Progress' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {rec.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {rec.status !== 'Completed' && (
                        <button
                          onClick={() => handleUpdateStatus(rec.id, 'Completed')}
                          className="px-3 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 ml-auto"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
