import React, { useState, useEffect } from 'react';
import { Asset, AssetCategory, AssetCondition } from '../types';
import { X, HardDrive } from 'lucide-react';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Asset | null;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    category: 'Laptop' as AssetCategory,
    condition: 'Excellent' as AssetCondition,
    location: 'HQ - Floor 1',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    expectedYears: '3',
    warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        serialNumber: initialData.serialNumber,
        category: initialData.category,
        condition: initialData.condition,
        location: initialData.location,
        purchaseDate: new Date(initialData.purchaseDate).toISOString().split('T')[0],
        purchaseCost: String(initialData.purchaseCost),
        expectedYears: String(initialData.expectedYears),
        warrantyExpiry: new Date(initialData.warrantyExpiry).toISOString().split('T')[0]
      });
    } else {
      setFormData({
        name: '',
        serialNumber: '',
        category: 'Laptop',
        condition: 'Excellent',
        location: 'HQ - Floor 1',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: '',
        expectedYears: '3',
        warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5 text-brand-400" />
            <h3 className="text-base font-bold text-white">
              {initialData ? `Edit Asset: ${initialData.assetTag}` : 'Register New Hardware / Software Asset'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. MacBook Pro 16 M3"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Serial Number *</label>
              <input
                type="text"
                required
                disabled={!!initialData}
                placeholder="e.g. C02G1234MD6R"
                value={formData.serialNumber}
                onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Monitor">Monitor</option>
                <option value="Mobile">Mobile Device</option>
                <option value="Software">Software License</option>
                <option value="Furniture">Furniture</option>
                <option value="Peripherals">Peripherals</option>
                <option value="Server">Server & Network</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Condition</label>
              <select
                value={formData.condition}
                onChange={e => setFormData({ ...formData, condition: e.target.value as AssetCondition })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Excellent">Excellent (New / Mint)</option>
                <option value="Good">Good (Minor Wear)</option>
                <option value="Fair">Fair (Needs Maintenance Soon)</option>
                <option value="Poor">Poor (Damaged)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Cost ($USD) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="2499.00"
                value={formData.purchaseCost}
                onChange={e => setFormData({ ...formData, purchaseCost: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Lifespan (Years)</label>
              <input
                type="number"
                value={formData.expectedYears}
                onChange={e => setFormData({ ...formData, expectedYears: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Warranty Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.warrantyExpiry}
                onChange={e => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Storage Location / Rack</label>
            <input
              type="text"
              placeholder="e.g. HQ Floor 3 - Cabinet B"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
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
              className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 disabled:opacity-50 shadow-lg shadow-brand-600/30"
            >
              {loading ? 'Saving...' : initialData ? 'Update Asset' : 'Register Asset & Generate QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
