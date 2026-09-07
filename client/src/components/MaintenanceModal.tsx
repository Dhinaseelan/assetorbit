import React, { useState } from 'react';
import { Asset } from '../types';
import api from '../services/api';
import { Wrench, X } from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess
}) => {
  const [performedBy, setPerformedBy] = useState('Internal IT Support');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('0.00');
  const [status, setStatus] = useState<'In_Progress' | 'Completed' | 'Scheduled'>('In_Progress');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/maintenance', {
        assetId: asset.id,
        performedBy,
        description,
        cost: parseFloat(cost || '0'),
        status
      });
      // Fire parent refresh immediately, then close
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log maintenance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Log Servicing / Repair Event</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
          <p className="font-bold text-white">{asset.name}</p>
          <p className="text-slate-400 font-mono text-[11px]">Tag: {asset.assetTag} | S/N: {asset.serialNumber}</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Serviced By / Repair Vendor</label>
            <input
              type="text"
              placeholder="e.g. AppleCare / Lenovo Support / Internal IT"
              value={performedBy}
              onChange={e => setPerformedBy(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Service Description *</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Replaced faulty battery and thermal paste."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Repair Cost ($USD)</label>
              <input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={cost}
                onChange={e => setCost(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Maintenance Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="In_Progress">In Progress</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 disabled:opacity-50 shadow-lg shadow-amber-600/30"
            >
              {loading ? 'Logging...' : 'Record Servicing Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
