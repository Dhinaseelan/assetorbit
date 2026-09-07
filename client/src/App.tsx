import React, { useState, useCallback, createContext, useContext } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { RegisterCompany } from './pages/RegisterCompany';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './pages/AssetList';
import { Assignments } from './pages/Assignments';
import { MaintenancePage } from './pages/MaintenancePage';
import { TicketsPage } from './pages/TicketsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { EmployeePortal } from './pages/EmployeePortal';
import { AssetModal } from './components/AssetModal';
import { AssignModal } from './components/AssignModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { TicketModal } from './components/TicketModal';
import { QRModal } from './components/QRModal';
import { Asset } from './types';
import api from './services/api';

// Global refresh context — any component can subscribe to refresh signals
interface RefreshContextType {
  refreshSignal: number;
  triggerRefresh: () => void;
}
const RefreshContext = createContext<RefreshContextType>({ refreshSignal: 0, triggerRefresh: () => {} });
export const useRefresh = () => useContext(RefreshContext);

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [publicPage, setPublicPage] = useState<'login' | 'register'>('login');

  // Global refresh signal — bump this after any mutation
  const [refreshSignal, setRefreshSignal] = useState(0);
  const triggerRefresh = useCallback(() => {
    setRefreshSignal(n => n + 1);
  }, []);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Selected asset for modals / inspection
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        <div className="flex items-center space-x-3">
          <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Initializing Assetorbit EAM...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (publicPage === 'register') {
      return <RegisterCompany onGoToLogin={() => setPublicPage('login')} />;
    }
    return <Login onGoToRegister={() => setPublicPage('register')} />;
  }

  const handleOpenAssign = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssignModalOpen(true);
  };

  const handleOpenMaintenance = (asset: Asset) => {
    setSelectedAsset(asset);
    setMaintenanceModalOpen(true);
  };

  const handleOpenTicket = (asset: Asset) => {
    setSelectedAsset(asset);
    setTicketModalOpen(true);
  };

  const handleOpenQR = async (asset?: Asset) => {
    setSelectedAsset(asset || null);
    try {
      const res = await api.get('/assets');
      setAllAssets(res.data);
    } catch (e) {}
    setQrModalOpen(true);
  };

  const handleCreateAssetSubmit = async (formData: any) => {
    await api.post('/assets', formData);
  };

  return (
    <RefreshContext.Provider value={{ refreshSignal, triggerRefresh }}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Top Header Navbar */}
        <Navbar onOpenScanner={() => handleOpenQR()} />

        {/* Main Workspace Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar Navigation */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Content View Area */}
          <main className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
            {activeTab === 'dashboard' && (
              <Dashboard
                onNavigateTab={setActiveTab}
                onSelectAsset={(asset) => {
                  setSelectedAsset(asset);
                  setActiveTab('assets');
                }}
              />
            )}

            {activeTab === 'assets' && (
              <AssetList
                onOpenCreateModal={() => setCreateModalOpen(true)}
                onOpenAssignModal={handleOpenAssign}
                onOpenMaintenanceModal={handleOpenMaintenance}
                onOpenTicketModal={handleOpenTicket}
                onOpenQRModal={(asset) => handleOpenQR(asset)}
                selectedAssetForDetail={selectedAsset}
              />
            )}

            {activeTab === 'assignments' && <Assignments />}

            {activeTab === 'maintenance' && <MaintenancePage />}

            {activeTab === 'tickets' && <TicketsPage />}

            {activeTab === 'audit' && <AuditLogPage />}

            {activeTab === 'my-portal' && (
              <EmployeePortal
                onOpenTicketModal={handleOpenTicket}
                onOpenQRModal={(asset) => handleOpenQR(asset)}
              />
            )}
          </main>
        </div>

        {/* Modals */}
        <AssetModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={async (formData) => {
            await handleCreateAssetSubmit(formData);
            triggerRefresh();
            setCreateModalOpen(false);
          }}
        />

        <AssignModal
          isOpen={assignModalOpen}
          asset={selectedAsset}
          onClose={() => setAssignModalOpen(false)}
          onSuccess={() => {
            triggerRefresh();
          }}
        />

        <MaintenanceModal
          isOpen={maintenanceModalOpen}
          asset={selectedAsset}
          onClose={() => {
            setMaintenanceModalOpen(false);
          }}
          onSuccess={() => {
            triggerRefresh();
          }}
        />

        <TicketModal
          isOpen={ticketModalOpen}
          asset={selectedAsset}
          onClose={() => {
            setTicketModalOpen(false);
          }}
          onSuccess={() => {
            triggerRefresh();
          }}
        />

        <QRModal
          isOpen={qrModalOpen}
          asset={selectedAsset}
          assets={allAssets}
          onClose={() => setQrModalOpen(false)}
          onSelectScannedAsset={(asset) => {
            setSelectedAsset(asset);
            setActiveTab('assets');
            setQrModalOpen(false);
          }}
        />
      </div>
    </RefreshContext.Provider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
