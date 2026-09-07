import React, { useState } from 'react';
import { Asset } from '../types';
import api from '../services/api';
import { LifeBuoy, X } from 'lucide-react';

interface TicketModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/tickets', {
        assetId: asset.id,
        title,
        description,
        priority
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <LifeBuoy className="h-5 w-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Report Equipment Damage / Request Repair</h3>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Summary *</label>
            <input
              type="text"
              required
              placeholder="e.g. Screen flickering or battery draining rapidly"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              required
              placeholder="Describe what happened and any steps taken..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Level</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="Low">Low (Minor cosmetic issue)</option>
              <option value="Medium">Medium (Affects daily work)</option>
              <option value="High">High (Hardware unusable)</option>
              <option value="Critical">Critical (Security or data risk)</option>
            </select>
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
              className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 disabled:opacity-50 shadow-lg shadow-rose-600/30"
            >
              {loading ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
