import React, { useState, useEffect } from 'react';
import { Asset, User } from '../types';
import api from '../services/api';
import { UserCheck, X, CheckCircle2 } from 'lucide-react';

interface AssignModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [assignedUserName, setAssignedUserName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDone(false);
      setError('');
      setNotes('');
      api.get('/users').then(res => {
        // Filter to only show employees (not retired/admin-only roles if needed)
        const list = res.data.filter((u: User) => u.id !== undefined);
        setUsers(list);
        if (list.length > 0) setSelectedUserId(list[0].id);
      }).catch(err => {
        console.error('Failed to load users:', err);
      });
    }
  }, [isOpen]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/assignments/assign', {
        assetId: asset.id,
        userId: selectedUserId,
        notes
      });
      const assigned = users.find(u => u.id === selectedUserId);
      setAssignedUserName(assigned?.name || 'Employee');
      setDone(true);
      // Fire parent refresh immediately so table updates behind the modal
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Checkout / Assign Asset</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {done ? (
          <div className="py-6 text-center space-y-3">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white">Asset Assigned!</p>
            <p className="text-xs text-slate-400">
              <span className="text-emerald-300 font-semibold">{asset.name}</span> has been assigned to{' '}
              <span className="text-blue-300 font-semibold">{assignedUserName}</span>.
            </p>
            <p className="text-[11px] text-slate-500">The asset list has been updated automatically.</p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Employee / Custodian *</label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.department} - {u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Checkout Assignment Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Issued during onboarding for remote office work."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
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
                  disabled={loading || users.length === 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/30"
                >
                  {loading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
