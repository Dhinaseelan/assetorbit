import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Asset, AssetCategory, AssetStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRefresh } from '../App';
import { can, Role } from '../config/rbac';
import { LifecycleStepper } from '../components/LifecycleStepper';
import {
  HardDrive,
  Plus,
  Search,
  Filter,
  QrCode,
  UserCheck,
  Wrench,
  RotateCcw,
  Archive,
  Download,
  Activity,
  LifeBuoy
} from 'lucide-react';

interface AssetListProps {
  onOpenCreateModal: () => void;
  onOpenAssignModal: (asset: Asset) => void;
  onOpenMaintenanceModal: (asset: Asset) => void;
  onOpenTicketModal: (asset: Asset) => void;
  onOpenQRModal: (asset: Asset) => void;
  selectedAssetForDetail?: Asset | null;
}

export const AssetList: React.FC<AssetListProps> = ({
  onOpenCreateModal,
  onOpenAssignModal,
  onOpenMaintenanceModal,
  onOpenTicketModal,
  onOpenQRModal,
  selectedAssetForDetail
}) => {
  const { user } = useAuth();
  const { refreshSignal, triggerRefresh } = useRefresh();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inspectedAsset, setInspectedAsset] = useState<Asset | null>(selectedAssetForDetail || null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets', {
        params: {
          search,
          category: categoryFilter,
          status: statusFilter
        }
      });
      setAssets(res.data);
      // Update the inspected asset with fresh data if it's still in the list
      if (inspectedAsset) {
        const updated = res.data.find((a: Asset) => a.id === inspectedAsset.id);
        if (updated) setInspectedAsset(updated);
      } else if (res.data.length > 0) {
        setInspectedAsset(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever filters change OR when refreshSignal bumps (after any mutation)
  useEffect(() => {
    fetchAssets();
  }, [search, categoryFilter, statusFilter, refreshSignal]);

  useEffect(() => {
    if (selectedAssetForDetail) {
      setInspectedAsset(selectedAssetForDetail);
    }
  }, [selectedAssetForDetail]);

  const handleRetireAsset = async (asset: Asset) => {
    if (!window.confirm(`Are you sure you want to retire asset ${asset.assetTag} (${asset.name})?`)) {
      return;
    }
    try {
      await api.post(`/assets/${asset.id}/retire`, { notes: 'Retired by administrator' });
      // Refresh the fetched asset list immediately
      fetchAssets();
      triggerRefresh();
    } catch (err) {
      alert('Failed to retire asset');
    }
  };

  const exportCSV = () => {
    const headers = ['Tag', 'Name', 'Serial Number', 'Category', 'Status', 'Condition', 'Assignee', 'Cost', 'Warranty Expiry'];
    const rows = assets.map(a => [
      a.assetTag,
      `"${a.name}"`,
      a.serialNumber,
      a.category,
      a.status,
      a.condition,
      a.currentAssignee ? `"${a.currentAssignee.name}"` : 'Unassigned',
      a.purchaseCost,
      new Date(a.warrantyExpiry).toLocaleDateString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Assetorbit_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const role = (user?.role || 'EMPLOYEE') as Role;
  const canCreate    = can(role, 'asset_create');
  const canAssign    = can(role, 'assign_checkout');
  const canMaintain  = can(role, 'maintenance_log');
  const canRetire    = can(role, 'asset_retire');
  const canExportCSV = can(role, 'asset_export_csv');

  return (
    <div className="p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <HardDrive className="h-5 w-5 text-brand-600" />
            <span>Asset Repository & Inventory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Full lifecycle CRUD, search, filter, chain-of-custody tracking, and QR barcode operations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {canExportCSV && (
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center space-x-2 transition-all shadow-xs"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          )}

          {canCreate && (
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-brand-600/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Register New Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset tag, name, serial number, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-brand-400"
          >
            <option value="ALL">All Categories</option>
            <option value="Laptop">Laptops</option>
            <option value="Desktop">Desktops</option>
            <option value="Monitor">Monitors</option>
            <option value="Mobile">Mobile Devices</option>
            <option value="Furniture">Furniture</option>
            <option value="Peripherals">Peripherals</option>
            <option value="Server">Servers</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-brand-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Selected Asset 7-Step Lifecycle Timeline Inspector */}
      {inspectedAsset && (
        <LifecycleStepper asset={inspectedAsset} />
      )}

      {/* Main Asset Data Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[10px] text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4">Tag & Asset Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Assignee</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Cost / Warranty</th>
                <th className="py-3.5 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                    Loading inventory records...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                    No hardware assets found matching criteria.
                  </td>
                </tr>
              ) : (
                assets.map(asset => {
                  const isInspected = inspectedAsset?.id === asset.id;
                  return (
                    <tr
                      key={asset.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isInspected ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''
                      }`}
                    >
                      <td
                        className="py-3 px-4 cursor-pointer"
                        onClick={() => setInspectedAsset(asset)}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-brand-700 border border-slate-200">
                            {asset.assetTag}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug hover:text-brand-600">
                              {asset.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              S/N: {asset.serialNumber} • {asset.location}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {asset.category}
                      </td>

                      <td className="py-3 px-4">
                        {asset.currentAssignee ? (
                          <div>
                            <p className="font-semibold text-slate-800">{asset.currentAssignee.name}</p>
                            <p className="text-[10px] text-slate-500">{asset.currentAssignee.department}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-normal">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          asset.condition === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                          asset.condition === 'Good' ? 'bg-blue-100 text-blue-700' :
                          asset.condition === 'Fair' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {asset.condition}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          asset.status === 'Assigned' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          asset.status === 'Available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          asset.status === 'Maintenance' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {asset.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">${asset.purchaseCost.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">
                          Warranty: {new Date(asset.warrantyExpiry).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onOpenQRModal(asset)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-600"
                            title="View QR Label"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>

                          {canAssign && asset.status === 'Available' && (
                            <button
                              onClick={() => onOpenAssignModal(asset)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600"
                              title="Assign to Employee"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}

                          {canMaintain && asset.status !== 'Retired' && (
                            <button
                              onClick={() => onOpenMaintenanceModal(asset)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600"
                              title="Log Maintenance"
                            >
                              <Wrench className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenTicketModal(asset)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                            title="Report Repair Issue"
                          >
                            <LifeBuoy className="h-4 w-4" />
                          </button>

                          {canRetire && asset.status !== 'Retired' && (
                            <button
                              onClick={() => handleRetireAsset(asset)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                              title="Retire Asset"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
