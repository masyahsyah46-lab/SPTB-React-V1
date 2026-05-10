import React, { useState, useEffect } from 'react';
import { db } from '../services/firebaseService';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { 
  ShoppingCart, 
  Trash2, 
  ExternalLink, 
  MapPin, 
  Tag, 
  Calendar,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const BakulPermohonan: React.FC = () => {
  const { currentUser } = useAuth();
  const { playSoundEffect, setActiveTab, setCachedData, cachedData, setSelectedRecord, basket } = useAppContext();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-cleanup items already in system
    basket.forEach(async (item: any) => {
        const inSystem = cachedData?.some(c => c.cidb === item.cidb);
        if (inSystem) {
            try {
                await deleteDoc(doc(db, "applications", item.id));
            } catch (e) { console.error(e); }
        }
    });
  }, [basket, cachedData]);

  const removeDoc = async (id: string) => {
    if (window.confirm("Padam dari bakul?")) {
        await deleteDoc(doc(db, "applications", id));
        playSoundEffect('minimal alert.mp3');
    }
  };

  const handleProses = async (item: any) => {
    playSoundEffect('ui_click.mp3');
    
    const persisted = localStorage.getItem('stb_form_persistence');
    if (persisted) {
        if (!window.confirm("Data borang sedia ada dikesan. Adakah anda ingin MENIMPA (Overwrite) data tersebut dengan maklumat syarikat ini?")) {
            return;
        }
    }

    // Set auto-fill logic
    setSelectedRecord({
        syarikat: item.company,
        cidb: item.cidb,
        gred: item.grade,
        jenis: item.type,
        tarikh: item.dateSubmitted,
        district: item.district,
        fromBakul: true
    });
    
    setActiveTab('borang');
    
    // Update status in Firestore
    await updateDoc(doc(db, "applications", item.id), {
        status: 'Processed'
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      <LoadingOverlay isVisible={loading} message="Menyemak Bakul Firestore..." />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <ShoppingCart size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Bakul Permohonan</h1>
                <p className="text-slate-500 font-medium">Senarai permohonan yang telah ditapis dan sedia diproses</p>
            </div>
        </div>
        <div className="bg-white px-8 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">JUMLAH KES</span>
            <span className="text-3xl font-black text-blue-600">{basket.length}</span>
        </div>
      </header>

      {basket.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-100 shadow-sm text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Bakul Kosong</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto">Anda belum menapis sebarang permohonan. Sila ke tab Tapisan Excel untuk memulakan.</p>
            <button onClick={() => setActiveTab('tapisan')} className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
                Ke Tapisan Excel
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {basket.map(item => {
                const typeColors: any = {
                    'BARU': 'border-b-blue-600 shadow-blue-50',
                    'PEMBAHARUAN': 'border-b-emerald-600 shadow-emerald-50',
                    'UBAH MAKLUMAT': 'border-b-amber-500 shadow-amber-50',
                    'UBAH GRED': 'border-b-purple-600 shadow-purple-50'
                };
                const tagColors: any = {
                    'BARU': 'bg-blue-100 text-blue-600',
                    'PEMBAHARUAN': 'bg-emerald-100 text-emerald-600',
                    'UBAH MAKLUMAT': 'bg-amber-100 text-amber-700',
                    'UBAH GRED': 'bg-purple-100 text-purple-600'
                };

                return (
                    <div key={item.id} className={cn(
                        "bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col border-b-[6px]",
                        typeColors[item.type] || 'border-b-slate-600 shadow-slate-50'
                    )}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                tagColors[item.type] || 'bg-slate-100 text-slate-600'
                            )}>
                                {item.grade} • {item.type}
                            </div>
                            <button onClick={() => removeDoc(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>

                    <h3 className="text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors uppercase truncate">
                        {item.company}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mb-6 uppercase tracking-widest">{item.cidb}</p>
                    
                    <div className="space-y-3 mb-8 flex-1">
                        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                            <MapPin size={16} />
                            {item.district}
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                            <Calendar size={16} />
                            Diterima: {item.dateSubmitted}
                        </div>
                    </div>

                    <button 
                        onClick={() => handleProses(item)}
                        className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
                    >
                        <PlayCircle size={18} /> PROSES PERMOHONAN
                    </button>
                </div>
            )})}
        </div>
      )}
    </div>
  );
};
