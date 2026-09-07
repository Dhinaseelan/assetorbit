import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Ticket } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRefresh } from '../App';
import { LifeBuoy, CheckCircle2, AlertCircle } from 'lucide-react';

export const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshSignal } = useRefresh();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [refreshSignal]);

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status });
      fetchTickets();
    } catch (err) {
      alert('Failed to update ticket status');
    }
  };

  const isIT = user?.role === 'ADMIN' || user?.role === 'IT_DEPT';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <LifeBuoy className="h-5 w-5 text-rose-400" />
            <span>Support & Repair Tickets</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isIT ? 'Manage employee hardware issue requests and track resolutions.' : 'View your submitted repair requests and status updates.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs font-semibold">
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs font-semibold">
            No support tickets reported.
          </div>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 glass-card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    ticket.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                    ticket.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {ticket.priority} Priority
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2 leading-snug">{ticket.title}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  ticket.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  ticket.status === 'In_Progress' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{ticket.description}</p>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] space-y-0.5">
                <p className="text-slate-200 font-semibold">{ticket.asset?.name || 'Hardware Asset'}</p>
                <p className="text-slate-400 font-mono">Tag: {ticket.asset?.assetTag}</p>
                <p className="text-slate-500">Filed by: {ticket.user?.name} ({ticket.user?.department})</p>
              </div>

              {isIT && ticket.status !== 'Resolved' && (
                <div className="pt-2 flex items-center space-x-2">
                  {ticket.status === 'Open' && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'In_Progress')}
                      className="w-full py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold border border-amber-500/30"
                    >
                      Start Repair
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(ticket.id, 'Resolved')}
                    className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30"
                  >
                    Mark Resolved
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
