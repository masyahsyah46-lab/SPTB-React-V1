import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useAppContext } from './context/AppContext';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { BorangSemakan } from './pages/BorangSemakan';
import { InputDatabase } from './pages/InputDatabase';
import { TapisanExcel } from './pages/TapisanExcel';
import { BakulPermohonan } from './pages/BakulPermohonan';
import { PortalYoutube } from './pages/PortalYoutube';
import { Senarai } from './pages/Senarai';
import { Sejarah } from './pages/Sejarah';
import { PaparanPelulus } from './pages/PaparanPelulus';
import { KeputusanPelulus } from './pages/KeputusanPelulus';
import { AdminDashboard } from './pages/AdminDashboard';
import { PrintLayouts } from './layouts/PrintLayouts';

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const { activeTab, selectedRecord } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-bold uppercase tracking-widest">Menyediakan Sistem...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'tapisan': return <TapisanExcel />;
      case 'bakul': return <BakulPermohonan />;
      case 'senarai': return <Senarai />;
      case 'sejarah': return <Sejarah />;
      case 'paparan': return <PaparanPelulus />;
      case 'keputusan': return <KeputusanPelulus />;
      case 'admin': return <AdminDashboard />;
      case 'borang': return <BorangSemakan />;
      case 'database': return <InputDatabase />;
      case 'youtube': return <PortalYoutube />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppLayout>
      <PrintLayouts data={selectedRecord} type="borang" />
      {renderContent()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
