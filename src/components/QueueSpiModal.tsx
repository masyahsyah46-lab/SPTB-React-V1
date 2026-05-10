import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  MapPin, 
  Calendar,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { cn } from '../lib/utils';

interface QueueItem {
  no: number;
  company: string;
  cidb: string;
  district: string;
  date: string;
  type?: string;
}

interface QueueSpiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueSpiModal: React.FC<QueueSpiModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ biasa: QueueItem[], pemutihan: QueueItem[] }>({ biasa: [], pemutihan: [] });
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await apiService.getQueueData();
        if (res.success) {
            setData({
                biasa: res.data.biasa || [],
                pemutihan: res.data.pemutihan || []
            });
        }
    } catch (e) {
        console.error("Queue Fetch Error");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  if (!isOpen) return null;

  const filterItems = (items: QueueItem[]) => {
    if (!search) return items;
    const q = search.toUpperCase();
    return items.filter(i => 
        i.company.toUpperCase().includes(q) || 
        i.cidb.toUpperCase().includes(q) || 
        i.district.toUpperCase().includes(q)
    );
  };

  const renderTable = (items: QueueItem[], title: string, color: string) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
            <h3 className={cn("text-sm font-black uppercase tracking-[0.2em]", color)}>{title}</h3>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black">{items.length} KES</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                        <th className="px-6 py-4">Syarikat / CIDB</th>
                        <th className="px-4 py-4">Daerah</th>
                        <th className="px-4 py-4">Tarikh</th>
                    </tr>
                </thead>
                <tbody className="divide-y text-[11px] font-bold">
                    {filterItems(items).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <p className="text-slate-800 uppercase leading-snug">{item.company}</p>
                                <p className="text-[9px] font-mono text-slate-400 mt-0.5 tracking-tighter">{item.cidb}</p>
                            </td>
                            <td className="px-4 py-4 text-slate-500">{item.district}</td>
                            <td className="px-4 py-4 text-slate-400 uppercase">{item.date}</td>
                        </tr>
                    ))}
                    {filterItems(items).length === 0 && (
                        <tr><td colSpan={3} className="p-10 text-center text-slate-300 italic uppercase">Tiada data dijumpai</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      
      <div className="bg-slate-50 w-full max-w-6xl max-h-[90vh] rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden animate-scaleIn border-8 border-white">
        <header className="p-8 border-b bg-white flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
                    <Clock size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Queue Status SPI</h2>
                    <p className="text-slate-400 text-xs font-medium italic">Data Siasatan & Pemutihan Terkini</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative group min-w-[250px]">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari syarikat..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                </div>
                <button 
                    onClick={fetchData}
                    className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                    <RefreshCw size={20} className={cn(loading && "animate-spin")} />
                </button>
                <button onClick={onClose} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                    <X size={24} />
                </button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                    <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Memuatkan Data Queue...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {renderTable(data.biasa, "1. Siasatan Biasa", "text-blue-600")}
                    {renderTable(data.pemutihan, "2. Pemutihan / Projek Khas", "text-orange-600")}
                </div>
            )}
        </main>

        <footer className="p-6 bg-blue-50 border-t border-blue-100 flex items-center justify-center gap-3">
            <AlertTriangle size={16} className="text-blue-600" />
            <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest leading-relaxed text-center">
                Nota: Senarai ini dipaparkan mengikut giliran sistem hantar-ke-spi. Mohon maklumkan unit SPI bagi urusan lawatan tapak.
            </p>
        </footer>
      </div>
    </div>
  );
};
