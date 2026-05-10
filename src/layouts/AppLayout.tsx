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
import { DigitalClock } from '../components/DigitalClock';

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
        <div className="flex items-center gap-3">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/2/26/Coat_of_arms_of_Malaysia.svg" 
            alt="Jata Negara" 
            className="w-8 h-8 brightness-0 invert" 
          />
          <h1 className="font-bold text-lg">SPTB (HQ)</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Navigation Tabs (Sticky) */}
      <div className={cn(
        "bg-white/80 backdrop-blur-md border-b sticky top-0 md:top-0 z-40 px-4 py-2 flex justify-center",
        isMobileMenuOpen ? "flex flex-col absolute inset-x-0 top-[60px] bg-white h-screen md:h-auto overflow-y-auto" : "hidden md:flex"
      )}>
        <nav className="flex flex-wrap items-center gap-1 max-w-7xl w-full">
          <div className="flex items-center gap-3 mr-6 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform duration-500">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/2/26/Coat_of_arms_of_Malaysia.svg" 
                alt="Jata Negara" 
                className="w-7 h-7 brightness-0 invert" 
              />
            </div>
            <div className="hidden lg:block">
              <h1 className="font-black text-xs uppercase tracking-widest text-slate-400 leading-none">Sistem Bersepadu</h1>
              <h2 className="font-black text-xl text-slate-800 leading-none">SPTB-HQ <span className="text-blue-600">V.3</span></h2>
            </div>
          </div>

          <div className="flex flex-1 gap-1 items-center overflow-x-auto no-scrollbar">
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 flex-shrink-0",
                  activeTab === item.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className={cn(
                  "transition-all duration-300 overflow-hidden whitespace-nowrap hidden lg:inline",
                  activeTab === item.id ? "max-w-[200px] opacity-100" : "max-w-[200px] opacity-100"
                )}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-6 ml-4">
            <div className="hidden xl:block">
              <DigitalClock />
            </div>

            <div className="hidden md:flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <div 
                className="text-right cursor-pointer hover:bg-white p-1 rounded-xl transition-colors"
                onClick={() => setActiveTab('youtube')}
              >
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{currentUser?.name}</p>
                <div className="flex items-center justify-end gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", currentUser ? "bg-green-500" : "bg-red-500")} />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{currentUser?.role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-10 h-10 bg-white text-red-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-700 transition-all active:scale-95"
                title="Log Keluar"
              >
                <LogOut size={18} />
              </button>
            </div>

            <button 
              onClick={() => setIsQueueModalOpen(true)}
              className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all active:scale-95"
              title="Queue Status SPI"
            >
              <Clock size={20} />
            </button>
          </div>
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
