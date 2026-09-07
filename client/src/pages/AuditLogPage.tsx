import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuditLog } from '../types';
import { useRefresh } from '../App';
import { History, ShieldCheck, Filter } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { refreshSignal } = useRefresh();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await api.get('/audit');
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [refreshSignal]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <History className="h-5 w-5 text-brand-400" />
            <span>Immutable Audit Trail & Activity Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Compliance trail capturing all asset additions, custody transfers, service events, and retirements.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Total System Log Entries: {logs.length}</span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Encrypted Audit Stream Active</span>
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">No audit events recorded yet.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start space-x-4">
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold border shrink-0 mt-0.5 ${
                  log.action === 'ASSET_CREATED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  log.action === 'ASSET_ASSIGNED' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                  log.action === 'ASSET_SERVICED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  log.action === 'ASSET_RETIRED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                  'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}>
                  {log.action}
                </span>

                <div className="flex-1 space-y-0.5">
                  <p className="text-xs font-bold text-white leading-snug">{log.details}</p>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                    <span>Executor Role: <strong className="text-slate-300">{log.userRole}</strong></span>
                    {log.asset && (
                      <span className="font-mono">Asset Tag: <strong className="text-brand-300">{log.asset.assetTag}</strong></span>
                    )}
                    <span>Timestamp: {new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
