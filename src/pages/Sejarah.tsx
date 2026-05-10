import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Calendar, 
  User, 
  Eye, 
  RotateCcw,
  Download,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const Sejarah: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    cachedData, 
    refreshData, 
    playSoundEffect, 
    setActiveTab, 
    setSelectedRecord 
  } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [filterApprover, setFilterApprover] = useState('SEMUA');
  const [filterMonth, setFilterMonth] = useState('SEMUA');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const months = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  const approvers = useMemo(() => {
    const names = new Set<string>();
    cachedData.forEach(i => {
      if (i.nama_pelulus) names.add(i.nama_pelulus);
    });
    return Array.from(names).sort();
  }, [cachedData]);

  const historyList = useMemo(() => {
    return cachedData.filter(item => {
      const status = item.kelulusan || '';
      // Only items that have a decision (LULUS, TOLAK, SIASAT)
      if (!status.includes('LULUS') && !status.includes('TOLAK') && !status.includes('SIASAT')) return false;

      // Filter Approver
      if (filterApprover !== 'SEMUA' && item.nama_pelulus !== filterApprover) return false;

      // Filter Date
      const dateStr = item.tarikh_kelulusan || item.tarikh_masuk || '';
      if (dateStr) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
              const m = parseInt(parts[1]) - 1;
              const y = parts[2];
              
              if (filterMonth !== 'SEMUA' && months[m] !== filterMonth) return false;
              if (filterYear !== 'SEMUA' && y !== filterYear) return false;
          }
      }

      return true;
    }).sort((a, b) => b.row - a.row); // Reverse row order for history
  }, [cachedData, filterApprover, filterMonth, filterYear]);

  const handleLihat = (item: any) => {
    setSelectedRecord(item);
    playSoundEffect('ui_click.mp3');
    setActiveTab('paparan');
  };

  const handleUndo = async (item: any) => {
    const isAllowed = currentUser?.role === 'SUPER_ADMIN' || currentUser?.name === item.nama_pelulus;
    if (!isAllowed) {
        alert("Hanya Pelulus asal atau Pentadbir boleh mengembalikan status permohonan ini.");
        return;
    }

    if (window.confirm("Batal keputusan dan kembalikan ke tab Inbox?")) {
      setLoading(true);
      try {
        await apiService.deleteRecord(item.row, 'padam_syor', currentUser?.name || '', currentUser?.email || '');
        playSoundEffect('minimal alert.mp3');
        await refreshData();
      } catch (e) {
        alert("Ralat memproses undo.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-20">
      <LoadingOverlay isVisible={loading} message="Memproses Data Sejarah..." />

      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                <History size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Arsip & Sejarah</h1>
                <p className="text-slate-500 font-medium">Rekod permohonan yang telah selesai diproses</p>
            </div>
        </div>
        
        <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-black rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]">
            <Download size={16} /> Eksport Laporan
        </button>
      </header>

      {/* Filters */}
      <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <User size={12} /> Nama Pelulus
            </label>
            <select 
                value={filterApprover}
                onChange={(e) => setFilterApprover(e.target.value)}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold uppercase text-xs focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            >
                <option value="SEMUA">SEMUA PELULUS</option>
                {approvers.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
        </div>

        <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <Calendar size={12} /> Bulan
            </label>
            <div className="flex gap-2">
                <select 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="flex-1 p-4 bg-slate-50 border-none rounded-2xl font-bold uppercase text-xs focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                >
                    <option value="SEMUA">SEMUA BULAN</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select 
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-32 p-4 bg-slate-50 border-none rounded-2xl font-bold uppercase text-xs focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                >
                    <option value="SEMUA">SEMUA</option>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y}</option>)}
                </select>
            </div>
        </div>

        <div className="flex items-end">
            <div className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">JUMLAH REKOD</span>
                <span className="text-xl font-black text-blue-800">{historyList.length}</span>
            </div>
        </div>
      </section>

      {/* List */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                    <th className="px-8 py-5">Syarikat & CIDB</th>
                    <th className="px-5 py-5">Keputusan</th>
                    <th className="px-5 py-5">Pelulus</th>
                    <th className="px-5 py-5">Tarikh</th>
                    <th className="px-8 py-5 text-center">Tindakan</th>
                </tr>
            </thead>
            <tbody className="divide-y text-sm">
                {historyList.map((item, idx) => {
                    const status = item.kelulusan || '';
                    const isLulus = status.includes('LULUS');
                    const isTolak = status.includes('TOLAK') || status.includes('SIASAT');

                    return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6">
                                <p className="font-bold text-slate-800 uppercase leading-tight group-hover:text-blue-600 transition-colors">{item.nama_syarikat}</p>
                                <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase font-bold tracking-widest">{item.no_rujukan_cidb}</p>
                            </td>
                            <td className="px-5 py-6">
                                <div className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                    isLulus ? "bg-green-100 text-green-700" : isTolak ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-400"
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", isLulus ? "bg-green-500" : "bg-red-500")} />
                                    {status}
                                </div>
                            </td>
                            <td className="px-5 py-6">
                                <p className="text-[11px] font-black text-slate-600 uppercase">{item.nama_pelulus || '-'}</p>
                            </td>
                            <td className="px-5 py-6">
                                <p className="text-[11px] font-bold text-slate-400 uppercase">{item.tarikh_kelulusan || item.tarikh_masuk || '-'}</p>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => handleLihat(item)}
                                        className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        title="Lihat Butiran"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleUndo(item)}
                                        className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                                        title="Batal Keputusan"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
        
        {historyList.length === 0 && (
            <div className="p-20 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tiada rekod sejarah untuk penapis yang dipilih</p>
            </div>
        )}
      </div>
    </div>
  );
};
