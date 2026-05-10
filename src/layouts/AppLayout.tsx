import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  ShoppingCart, 
  CheckSquare, 
  Database, 
  ClipboardList, 
  History,
  LogOut,
  Menu,
  X,
  Youtube,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { QueueSpiModal } from '../components/QueueSpiModal';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dash', icon: <LayoutDashboard size={20} /> },
  { id: 'admin', label: 'Admin', icon: <ShieldAlert size={20} />, roles: ['KETUA_SEKSYEN', 'PENGARAH', 'SUPER_ADMIN'] },
  { id: 'tapisan', label: 'Tapis', icon: <FileSpreadsheet size={20} />, roles: ['PENGESYOR', 'ADMIN', 'SUPER_ADMIN'] },
  { id: 'bakul', label: 'Bakul', icon: <ShoppingCart size={20} />, roles: ['PENGESYOR', 'ADMIN', 'SUPER_ADMIN'] },
  { id: 'borang', label: 'Borang', icon: <CheckSquare size={20} />, roles: ['PENGESYOR', 'ADMIN', 'SUPER_ADMIN'] },
  { id: 'senarai', label: 'Senarai', icon: <ClipboardList size={20} /> },
  { id: 'sejarah', label: 'Sejarah', icon: <History size={20} /> },
  { id: 'youtube', label: 'Multimedia', icon: <Youtube size={20} /> },
  { id: 'database', label: 'Database', icon: <Database size={20} />, roles: ['PENGESYOR', 'ADMIN', 'SUPER_ADMIN'] },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { activeTab, setActiveTab } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => 
    !item.roles || (currentUser && item.roles.includes(currentUser.role))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <QueueSpiModal isOpen={isQueueModalOpen} onClose={() => setIsQueueModalOpen(false)} />
      {/* Mobile Header */}
      <header className="md:hidden bg-blue-600 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <h1 className="font-bold text-lg">SPTB (HQ)</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Navigation Tabs (Sticky) */}
      <div className={cn(
        "bg-white/80 backdrop-blur-md border-b sticky top-0 md:top-0 z-40 px-4 py-2 flex justify-center",
        isMobileMenuOpen ? "flex flex-col absolute inset-x-0 top-[60px] bg-white h-screen md:h-auto overflow-y-auto" : "hidden md:flex"
      )}>
        <nav className="flex flex-wrap gap-1 justify-center max-w-7xl w-full">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300",
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105" 
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={cn(
                "transition-all duration-300 overflow-hidden whitespace-nowrap",
                activeTab === item.id ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0 md:max-w-[200px] md:opacity-100"
              )}>
                {item.label}
              </span>
            </button>
          ))}
          
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-red-600 hover:bg-red-50 ml-auto"
          >
            <LogOut size={20} />
            <span className="hidden md:inline">Log Keluar</span>
          </button>

          <button 
            onClick={() => setIsQueueModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="Queue Status SPI"
          >
            <Clock size={20} />
            <span className="hidden md:inline text-[10px] uppercase font-black tracking-widest ml-1">Queue SPI</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 overflow-x-hidden">
        {children}
      </main>

      {/* User Status Bar */}
      <footer className="bg-white border-t p-3 flex justify-between items-center text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", currentUser ? "bg-green-500" : "bg-red-500")} />
          <span>{currentUser ? `Log Masuk sebagai: ${currentUser.name} (${currentUser.role})` : "Belum Log Masuk"}</span>
        </div>
        <div className="hidden sm:block">
          {new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </footer>
    </div>
  );
};
