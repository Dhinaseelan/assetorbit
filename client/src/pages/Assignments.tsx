import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AssetAssignment } from '../types';
import { useRefresh } from '../App';
import { Users, RotateCcw, ShieldCheck } from 'lucide-react';

export const Assignments: React.FC = () => {
  const { refreshSignal, triggerRefresh } = useRefresh();
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [refreshSignal]);

  const handleReturnAsset = async (assignmentId: string) => {
    if (!window.confirm('Process return for this asset back into available inventory?')) return;
    try {
      await api.post(`/assignments/${assignmentId}/return`, { notes: 'Returned to storage' });
      fetchAssignments();
      triggerRefresh();
    } catch (err) {
      alert('Failed to return asset');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-400" />
            <span>Chain of Custody & Asset Assignments</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit historical and current equipment distribution across employees and departments.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 uppercase tracking-wider text-[10px] text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">Asset Information</th>
                <th className="py-3.5 px-4">Assigned To (Custodian)</th>
                <th className="py-3.5 px-4">Issued By</th>
                <th className="py-3.5 px-4">Assignment Date</th>
                <th className="py-3.5 px-4">Custody Status</th>
                <th className="py-3.5 px-4 text-right">Return Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading assignment records...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No active or historical assignment records found.
                  </td>
                </tr>
              ) : (
                assignments.map(item => {
                  const isActive = !item.returnDate;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{item.asset?.name || 'Asset'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Tag: {item.asset?.assetTag} | S/N: {item.asset?.serialNumber}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-200">{item.user?.name}</p>
                        <p className="text-[10px] text-slate-400">{item.user?.department} ({item.user?.email})</p>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {item.assignedBy}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {new Date(item.assignmentDate).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Active Checkout
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Returned ({new Date(item.returnDate!).toLocaleDateString()})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isActive && (
                          <button
                            onClick={() => handleReturnAsset(item.id)}
                            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 ml-auto"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-brand-400" />
                            <span>Process Return</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
