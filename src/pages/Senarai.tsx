import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  MoreVertical,
  Inbox,
  Send,
  FileText,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { LoadingOverlay } from '../components/LoadingOverlay';

type ListType = 'draft' | 'submitted' | 'inbox';

export const Senarai: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    cachedData, 
    refreshData, 
    playSoundEffect, 
    setActiveTab, 
    setSelectedRecord 
  } = useAppContext();
  
  const [activeSubTab, setActiveSubTab] = useState<ListType>('draft');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('SEMUA');
  const [loading, setLoading] = useState(false);

  // Debouncing search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredList = useMemo(() => {
    return cachedData.filter(item => {
      // 1. Filter by Sub-Tab logic
      let matchTab = false;
      const status = item.kelulusan || '';
      const pengesyor = item.nama_pengesyor || '';
      
      if (activeSubTab === 'draft') {
        matchTab = (!item.tarikh_syor || item.tarikh_syor === '') && (pengesyor === currentUser?.name || item.pengesyor === currentUser?.name);
      } else if (activeSubTab === 'submitted') {
        matchTab = (item.tarikh_syor && item.tarikh_syor !== '') && (pengesyor === currentUser?.name || item.pengesyor === currentUser?.name);
      } else if (activeSubTab === 'inbox') {
        matchTab = (item.tarikh_syor && item.tarikh_syor !== '') && (currentUser?.role === 'PELULUS' || currentUser?.role === 'SUPER_ADMIN');
      }

      if (!matchTab) return false;

      // 2. Filter by status attribute (SEMUA, LULUS, TOLAK, etc)
      if (currentFilter !== 'SEMUA') {
        if (currentFilter === 'LULUS') if (!status.includes('LULUS')) return false;
        if (currentFilter === 'TOLAK') if (!status.includes('TOLAK') && !status.includes('SIASAT')) return false;
        if (currentFilter === 'BARU') if (item.jenis?.toUpperCase() !== 'BARU') return false;
      }

      // 3. Search query
      if (debouncedQuery) {
        const q = debouncedQuery.toUpperCase();
        return (
          item.nama_syarikat?.toUpperCase().includes(q) ||
          item.no_rujukan_cidb?.toUpperCase().includes(q) ||
          item.daerah?.toUpperCase().includes(q)
        );
      }

      return true;
    });
  }, [cachedData, activeSubTab, currentFilter, debouncedQuery, currentUser]);

  const getStatusBadge = (item: any) => {
    const status = (item.kelulusan || '').toUpperCase();
    
    if (status.includes('LULUS') || status.includes('SOKONG')) return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">LULUS</span>;
    if (status.includes('TOLAK') || status.includes('SIASAT')) return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">TOLAK/SIASAT</span>;
    if (item.tarikh_syor && item.tarikh_syor !== '') return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">PENDING PELULUS</span>;
    
    return <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">DRAFT</span>;
  };

  const getTypeBadge = (item: any) => {
    const type = item.jenis?.toUpperCase() || '';
    const isSpecial = item.segera === 'YA' || item.db_kelulusan_spi === 'YA';
    
    if (isSpecial) return <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[9px] font-black flex items-center gap-1 shadow-sm"><Zap size={8} fill="currentColor" /> SPI</span>;
    if (type === 'BARU') return <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-[9px] font-black">BARU</span>;
    if (type.includes('PEMBAHARUAN')) return <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] font-black">PEMBAHARUAN</span>;
    return <span className="bg-slate-500 text-white px-2 py-0.5 rounded text-[9px] font-black">{type}</span>;
  };

  const handleDelete = async (row: number) => {
    if (window.confirm("Padam permohonan ini secara kekal?")) {
      setLoading(true);
      try {
        await apiService.deleteRecord(row, 'padam_semua', currentUser?.name || '', currentUser?.email || '');
        playSoundEffect('minimal alert.mp3');
        await refreshData();
      } catch (e) {
        alert("Ralat memadam rekod.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUndo = async (row: number) => {
    if (window.confirm("Tarik balik permohonan ini? Rekod akan kembali ke folder Draf.")) {
      setLoading(true);
      try {
        await apiService.saveRecord({
            row,
            action: 'undo_syor',
            pengesyor: currentUser?.name
        });
        playSoundEffect('minimal alert.mp3');
        await refreshData();
      } catch (e) {
        alert("Ralat tarik balik permohonan.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAction = (item: any) => {
    setSelectedRecord(item);
    playSoundEffect('ui_click.mp3');
    if (activeSubTab === 'inbox') {
      setActiveTab('keputusan');
    } else if (activeSubTab === 'draft') {
      setActiveTab('database'); // Jump to InputDatabase for editing
    } else {
      setActiveTab('paparan');
    }
  };

  const counts = useMemo(() => {
    const res = { draft: 0, submitted: 0, inbox: 0, baru: 0 };
    cachedData.forEach(item => {
      const pengesyor = item.nama_pengesyor || item.pengesyor || '';
      const hasSyor = item.tarikh_syor && item.tarikh_syor !== '';
      
      if (!hasSyor && pengesyor === currentUser?.name) res.draft++;
      if (hasSyor && pengesyor === currentUser?.name) res.submitted++;
      if (hasSyor && (currentUser?.role === 'PELULUS' || currentUser?.role === 'SUPER_ADMIN')) res.inbox++;
      if (item.jenis?.toUpperCase() === 'BARU') res.baru++;
    });
    return res;
  }, [cachedData, currentUser]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-20">
      <LoadingOverlay isVisible={loading} message="Mengemaskini Senarai..." />

      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Pengurusan Rekod</h1>
          <p className="text-slate-500 font-medium">Sila pilih kategori semakan di bawah</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-[2rem] shadow-sm border border-slate-100">
            {[
                { id: 'draft', label: 'DRAF', icon: <FileText size={16} />, count: counts.draft },
                { id: 'submitted', label: 'Telah Disyor', icon: <Send size={16} />, count: counts.submitted },
                { id: 'inbox', label: 'Inbox Pelulus', icon: <Inbox size={16} />, count: counts.inbox }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => {
                        setActiveSubTab(tab.id as ListType);
                        playSoundEffect('ui_click.mp3');
                    }}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeSubTab === tab.id 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                            : "text-slate-400 hover:bg-slate-50"
                    )}
                >
                    {tab.icon}
                    {tab.label}
                    {tab.count > 0 && (
                        <span className={cn(
                            "ml-1 px-2 py-0.5 rounded-full text-[8px]",
                            activeSubTab === tab.id ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                        )}>
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
      </header>

      {/* Filters & Search */}
      <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama Syarikat, CIDB atau Daerah..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold uppercase transition-all"
            />
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl">
            {['SEMUA', 'LULUS', 'TOLAK', 'BARU'].map(f => (
                <button
                    key={f}
                    onClick={() => setCurrentFilter(f)}
                    className={cn(
                        "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        currentFilter === f ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    {f}
                </button>
            ))}
        </div>
      </section>

      {/* List */}
      {filteredList.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-100 shadow-sm text-center">
            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Tiada Rekod Dijumpai</h3>
            <p className="text-slate-400 font-medium">Sila cuba kata kunci lain atau tukar kategori tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredList.map((item, idx) => (
                <div key={idx} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-500 group flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col gap-2">
                           <div className="flex gap-2">
                            {getTypeBadge(item)}
                            {getStatusBadge(item)}
                           </div>
                           <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest leading-3 mt-1">NO: {item.no_pendaftaran || item.row}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeSubTab === 'draft' && (
                                <button 
                                    onClick={() => handleDelete(item.row)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button className="p-2 text-slate-300 hover:text-slate-800 rounded-lg">
                                <MoreVertical size={16} />
                            </button>
                        </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors uppercase line-clamp-2 min-h-[3.5rem]">
                        {item.nama_syarikat || 'TIADA NAMA SYARIKAT'}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 mb-6 font-black tracking-widest">{item.no_rujukan_cidb || 'TIADA NO CIDB'}</p>
                    
                    <div className="space-y-3 mb-8 flex-1">
                        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                            <Clock size={14} className="text-blue-500" />
                            {item.tarikh_masuk || item.tarikh_permohonan || '-'}
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {item.daerah || 'TIADA DAERAH'}
                        </div>
                    </div>

                    <button 
                        onClick={() => handleAction(item)}
                        className={cn(
                            "w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg",
                            activeSubTab === 'inbox' 
                              ? "bg-slate-800 text-white shadow-slate-200 hover:bg-slate-900" 
                              : "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700",
                            activeSubTab === 'submitted' && "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                        )}
                    >
                        {activeSubTab === 'inbox' ? (
                            <>SEMAK & LULUS <ArrowRight size={16} /></>
                        ) : activeSubTab === 'draft' ? (
                            <>SUNTING DRAF <Edit3 size={16} /></>
                        ) : activeSubTab === 'submitted' ? (
                            <>LIHAT BORANG <Eye size={16} /></>
                        ) : (
                            <>LIHAT BUTIRAN <Eye size={16} /></>
                        )}
                    </button>
                    {activeSubTab === 'submitted' && (
                        <button 
                            onClick={() => handleUndo(item.row)}
                            className="mt-2 w-full py-3 bg-amber-50 text-amber-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-100 transition-all border border-amber-200"
                        >
                            UNDO PENYORAN (BALIK KE DRAF)
                        </button>
                    )}
                    
                    {/* Decorative element */}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-slate-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-700 -z-0 opacity-50" />
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
