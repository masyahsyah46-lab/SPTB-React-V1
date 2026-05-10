import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  User, 
  Briefcase, 
  History,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

export const ProfileSyarikat: React.FC = () => {
  const { playSoundEffect } = useAppContext();
  const [searchCIDB, setSearchCIDB] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('umum');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!searchCIDB) return;
    setLoading(true);
    playSoundEffect('ui_click.mp3');
    
    // Mock profile creation/search
    setTimeout(() => {
        setProfile({
            companyName: 'SYARIKAT CONTOH SDN BHD',
            cidb: searchCIDB,
            grade: 'G7',
            status: 'AKTIF',
            address: 'NO 123, JALAN MERDEKA, 50480 KUALA LUMPUR',
            phone: '012-3456789',
            directors: [
                { name: 'AHMAD BIN ALI', ic: '800101-14-1234', position: 'PENGARAH' }
            ],
            history: [
                { date: '2023-01-01', type: 'BARU', status: 'LULUS' }
            ]
        });
        setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">PROFIL SYARIKAT</h1>
                <p className="text-slate-500 font-medium">Pangkalan Data Induk Kontraktor SPTB</p>
            </div>
        </div>
        
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <input 
                value={searchCIDB}
                onChange={(e) => setSearchCIDB(e.target.value)}
                placeholder="Carian No CIDB..."
                className="pl-4 pr-2 py-2 bg-transparent outline-none font-bold uppercase text-xs w-48"
            />
            <button 
                onClick={handleSearch}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all"
            >
                {loading ? '...' : <Search size={16} />}
            </button>
        </div>
      </header>

      {!profile ? (
        <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center">
            <h3 className="text-xl font-black text-slate-800 mb-2">Sila Masukkan No CIDB</h3>
            <p className="text-slate-400 font-medium mb-8">Pilih fail atau masukkan nombor pendaftaran untuk melihat/mencipta profil.</p>
            <button 
                onClick={() => setProfile({ companyName: '', cidb: '', grade: '', directors: [], history: [] })}
                className="px-10 py-4 bg-blue-600 text-white font-black rounded-[2rem] shadow-xl shadow-blue-100 flex items-center gap-2 mx-auto hover:bg-blue-700 transition-all uppercase tracking-widest text-xs"
            >
                <Plus size={18} strokeWidth={3} /> CIPTA PROFIL BARU
            </button>
        </div>
      ) : (
        <div className="space-y-8">
            {/* Quick Summary Card */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                    <Building2 size={240} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-1 bg-green-500 text-white rounded-full text-[10px] font-black tracking-widest uppercase">SYARIKAT AKTIF</span>
                        <span className="px-4 py-1 bg-white/10 text-white rounded-full text-[10px] font-black tracking-widest uppercase">{profile.grade || 'G-'}</span>
                    </div>
                    <h2 className="text-4xl font-black mb-2 tracking-tight uppercase leading-tight max-w-2xl">{profile.companyName || 'NAMA SYARIKAT BARU'}</h2>
                    <p className="text-slate-400 font-mono font-bold tracking-widest text-lg">{profile.cidb || 'TIADA NO CIDB'}</p>
                </div>

                <div className="flex gap-1 mt-10 bg-white/5 p-1.5 rounded-[2rem] border border-white/10 w-fit">
                    {[
                        { id: 'umum', label: 'Maklumat Umum', icon: <Building2 size={16} /> },
                        { id: 'personnel', label: 'Personel', icon: <User size={16} /> },
                        { id: 'projek', label: 'Rekod Projek', icon: <Briefcase size={16} /> },
                        { id: 'sejarah', label: 'Sejarah SPTB', icon: <History size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeSubTab === tab.id ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-white"
                            )}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="animate-slideUp">
                <AnimatePresence mode="wait">
                    {activeSubTab === 'umum' && (
                        <motion.div key="umum" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="ALAMAT & HUBUNGAN">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <textarea className="form-input bg-slate-50 border-slate-100 h-32 resize-none pt-3 font-bold uppercase" placeholder="Alamat Perniagaan..." defaultValue={profile.address} />
                        <input className="form-input bg-slate-50 border-slate-100 font-bold" placeholder="No Telefon..." defaultValue={profile.phone} />
                        <input className="form-input bg-slate-50 border-slate-100 font-bold" placeholder="Emel Syarikat..." />
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Pautan Drive (QR)</p>
                        <div className="w-40 h-40 bg-white p-2 rounded-2xl shadow-inner flex items-center justify-center">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(profile.driveLink || 'https://cidb.gov.my')}`} 
                                alt="QR Code" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <input 
                            className="mt-4 form-input text-[10px] h-8 bg-white border-slate-200" 
                            placeholder="Pautan Google Drive..." 
                            onChange={(e) => setProfile({...profile, driveLink: e.target.value})}
                        />
                    </div>
                </div>
            </Card>
                            <Card title="MAKLUMAT PENDAFTARAN">
                                <div className="space-y-6">
                                    <input className="form-input bg-slate-50 border-slate-100 font-bold uppercase" placeholder="No Pendaftaran (SSM)..." />
                                    <input className="form-input bg-slate-50 border-slate-100 font-bold uppercase" placeholder="Jenis Syarikat (Sdn Bhd/Enterprise)..." />
                                    <div className="p-6 bg-blue-50 rounded-2xl border-2 border-blue-100">
                                        <h4 className="text-[10px] font-black text-blue-600 mb-2 uppercase tracking-widest leading-none">Status SSM</h4>
                                        <div className="flex items-center gap-2 text-blue-800 font-black">
                                            <CheckCircle2 size={16} />
                                            AKTIF (WUJUD)
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                    {activeSubTab === 'personnel' && (
                        <motion.div key="personnel" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                             <Card title="LISTING PERSONEL">
                                <div className="space-y-4">
                                    {profile.directors?.map((p: any, idx: number) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-black text-slate-800 uppercase tracking-tight">{p.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-widest">{p.ic} • {p.position}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase">PENGARAH</span>
                                        </div>
                                    ))}
                                    <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                                        <Plus size={14} /> TAMBAH PERSONEL
                                    </button>
                                </div>
                             </Card>
                        </motion.div>
                    )}
                    {activeSubTab === 'sejarah' && (
                        <motion.div key="sejarah" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                             <Card title="REKOD PERMOHONAN SPTB">
                                <div className="space-y-4">
                                    {profile.history?.map((h: any, idx: number) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-black text-slate-800 uppercase tracking-tight">KUSKOP/CIDB/{h.type}/{idx+1001}</p>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-widest">TARIKH: {h.date} • STATUS: {h.status}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] font-black uppercase">LULUS</span>
                                        </div>
                                    ))}
                                </div>
                             </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="flex justify-end gap-3">
                <button className="px-8 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">
                    RESET
                </button>
                <button 
                   onClick={() => { playSoundEffect('positive_chime.mp3'); alert("Profil berjaya dikemaskini!"); }}
                   className="px-12 py-4 bg-slate-800 text-white font-black rounded-2xl shadow-xl hover:bg-slate-900 transition-all uppercase tracking-widest text-[10px] flex items-center gap-2"
                >
                    <Save size={18} /> SIMPAN PROFIL
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-8 border-b pb-4 uppercase tracking-tighter flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-600 rounded-full" />
            {title}
        </h3>
        <div>{children}</div>
    </div>
);
