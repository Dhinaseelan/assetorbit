import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRefresh } from '../App';
import { Asset, Ticket } from '../types';
import { 
  Laptop, 
  QrCode, 
  LifeBuoy, 
  CheckCircle2, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  AlertCircle,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  User,
  Activity
} from 'lucide-react';

interface EmployeePortalProps {
  onOpenTicketModal: (asset: Asset) => void;
  onOpenQRModal: (asset: Asset) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  onOpenTicketModal,
  onOpenQRModal
}) => {
  const { user } = useAuth();
  const { refreshSignal } = useRefresh();
  const [assignedAssets, setAssignedAssets] = useState<Asset[]>([]);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [assetsRes, ticketsRes] = await Promise.all([
          api.get('/assets'),
          api.get('/tickets')
        ]);

        // Filter assets currently assigned to this logged in user
        const myAssets = assetsRes.data.filter(
          (a: Asset) => a.currentAssignee?.id === user?.id || (user?.role === 'EMPLOYEE' && a.currentAssignee?.email === user.email)
        );

        setAssignedAssets(myAssets);
        setUserTickets(ticketsRes.data);
      } catch (err) {
        console.error('Failed to load employee portal data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, refreshSignal]);

  // Calculate ticket stats
  const activeTickets = userTickets.filter(t => t.status !== 'Resolved').length;
  const resolvedTickets = userTickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        {/* Decorative background gradients */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm flex-shrink-0">
              <User className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="h-3 w-3" />
                <span>Employee Portal</span>
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Manage your hardware custody, request support, and track your active equipment lifecycle.
              </p>
            </div>
          </div>

          {/* Department badge / Info info */}
          <div className="flex flex-wrap gap-2 md:self-center">
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <span>Dept: <strong>{user?.department || 'Engineering'}</strong></span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center space-x-2">
              <span>Email: <strong>{user?.email}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Stats Card 1: Equipment Count */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Equipment</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{assignedAssets.length}</h3>
            <p className="text-[10px] text-slate-500 font-medium">Active hardware in your custody</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Laptop className="h-6 w-6" />
          </div>
        </div>

        {/* Stats Card 2: Active Tickets */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Service Tickets</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{activeTickets}</h3>
            <p className="text-[10px] text-slate-500 font-medium">Under review by IT department</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <LifeBuoy className="h-6 w-6" />
          </div>
        </div>

        {/* Stats Card 3: Custody Status */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Compliance & Security</p>
            <h3 className="text-sm font-bold text-emerald-700 flex items-center space-x-1.5 mt-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
              <span>Custody Verified</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">All device handshakes are up-to-date</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Equipment Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Laptop className="h-5 w-5 text-brand-600" />
              <span>My Currently Assigned Equipment</span>
            </h2>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
              {assignedAssets.length} Assets
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center border border-slate-200 rounded-2xl bg-white space-y-3">
              <div className="h-8 w-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Retrieving assigned hardware records...</p>
            </div>
          ) : assignedAssets.length === 0 ? (
            <div className="p-10 border border-dashed border-slate-300 rounded-2xl bg-white text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Laptop className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">No checked out equipment</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                  There are no hardware assets registered to your name. If you recently requested equipment, please contact your administrator or IT department.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignedAssets.map(asset => (
                <div 
                  key={asset.id} 
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-brand-300 transition-all duration-200 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Card Top: Asset Tag & Barcode button */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-100">
                        {asset.assetTag}
                      </span>
                      <button
                        onClick={() => onOpenQRModal(asset)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Show Asset QR Tag"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Card Middle: Asset Name & Category */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{asset.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{asset.category}</p>
                    </div>

                    {/* Specifications List */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Serial Number</span>
                        <span className="font-mono font-bold text-slate-800">{asset.serialNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Location</span>
                        <span className="text-slate-800">{asset.location || 'HQ Office'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Warranty Expiry</span>
                        <span className="text-slate-800 flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(asset.warrantyExpiry).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Request Support Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => onOpenTicketModal(asset)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs group"
                    >
                      <LifeBuoy className="h-4 w-4 text-slate-500 group-hover:text-rose-600 transition-colors" />
                      <span>Report Issue / Request Service</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Column: Service Tickets Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <LifeBuoy className="h-5 w-5 text-rose-500" />
              <span>Service Tickets</span>
            </h2>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
              {userTickets.length} Filed
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Service History</p>
            
            {userTickets.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-bold">No active service tickets</p>
                <p className="text-[10px] text-slate-400 font-medium">Your hardware is healthy. If you run into issues, request support on your device card.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {userTickets.map(ticket => {
                  const isResolved = ticket.status === 'Resolved';
                  return (
                    <div 
                      key={ticket.id} 
                      className={`p-3.5 rounded-xl border transition-all duration-150 ${
                        isResolved 
                          ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200' 
                          : 'bg-amber-50/20 border-amber-100 hover:border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                          isResolved 
                            ? 'bg-emerald-100/60 text-emerald-800 border-emerald-200' 
                            : 'bg-amber-100/60 text-amber-800 border-amber-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                          <span>{ticket.status}</span>
                        </span>
                        
                        <span className="text-[9px] text-slate-400 font-semibold flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">{ticket.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-1 font-medium leading-relaxed">{ticket.description}</p>
                      </div>

                      {/* Display asset tag for context if ticket has it */}
                      {ticket.assetId && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">Related Device:</span>
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {ticket.asset?.assetTag || 'Device'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
