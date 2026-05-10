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
  const { playSoundEffect, setActiveTab, setCachedData, cachedData } = useAppContext();
  const [basket, setBasket] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.firebaseCode) return;

    setLoading(true);
    const q = query(
      collection(db, "applications"),
      where("processedBy", "==", currentUser.firebaseCode),
      where("status", "==", "Pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Auto-cleanup items already in system
      items.forEach(async (item: any) => {
          const inSystem = cachedData?.some(c => c.cidb === item.cidb);
          if (inSystem) {
              await deleteDoc(doc(db, "applications", item.id));
          }
      });

      setBasket(items.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, cachedData]);

  const removeDoc = async (id: string) => {
    if (window.confirm("Padam dari bakul?")) {
        await deleteDoc(doc(db, "applications", id));
        playSoundEffect('minimal alert.mp3');
    }
  };

  const handleProses = async (item: any) => {
    playSoundEffect('ui_click.mp3');
    
    // Set auto-fill logic would normally go here into context or local state
    // For this migration, we simplify and navigate
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
            {basket.map(item => (
                <div key={item.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-500 group flex flex-col border-b-[6px] border-b-blue-600">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
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
            ))}
        </div>
      )}
    </div>
  );
};
