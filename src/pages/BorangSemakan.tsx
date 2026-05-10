import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  X as XIcon, 
  Zap, 
  Printer, 
  Save, 
  Building2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { CustomModal } from '../components/CustomModal';
import { pdfProcessor } from '../utils/pdfProcessor';

// Types for Personnel
interface Person {
  id: string;
  name: string;
  isCompany: boolean;
  roles: string[];
  s_ic: string;
  s_sb: string;
  s_epf: string;
}

export const BorangSemakan: React.FC = () => {
  const { currentUser } = useAuth();
  const { playSoundEffect, autoSaveForm, loadPersistedForm, setActiveTab } = useAppContext();
  
  // Form State
  const [form, setForm] = useState<any>({
    jenisApp: '',
    borang_syarikat: '',
    borang_cidb: '',
    borang_gred: '',
    borang_tarikh_mohon: '',
    borang_tatatertib: '',
    borang_justifikasi: '',
    borang_no_telefon: '',
    spkkDuration: '',
    stbDuration: '',
    ssm_date_input: '',
    ssm_status: '',
    bank_date_input: '',
    bank_sign_input: '',
    bank_status_input: '',
    doc_carta_status: '',
    doc_peta_status: '',
    doc_gambar_status: '',
    doc_sewa_status: '',
    kwsp_date_1: '', kwsp_s1: '',
    kwsp_date_2: '', kwsp_s2: '',
    kwsp_date_3: '', kwsp_s3: '',
    ubah_maklumat: '',
    ubah_gred: ''
  });

  const [personnel, setPersonnel] = useState<Person[]>([
    { id: Date.now().toString(), name: '', isCompany: false, roles: [], s_ic: '', s_sb: '', s_epf: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [aiProvider, setAiProvider] = useState('auto');
  
  // UI States
  const [showQuickCheck, setShowQuickCheck] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('Tiada fail dipilih');
  const [isAILoading, setIsAILoading] = useState(false);
  const [pdfExtracted, setPdfExtracted] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    const data = loadPersistedForm();
    if (data && data.fields) {
      if (data.fields.personnel) setPersonnel(data.fields.personnel);
      setForm(data.fields);
    }
  }, []);

  useEffect(() => {
    autoSaveForm({ ...form, personnel });
  }, [form, personnel, autoSaveForm]);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target as any;
    const val = (e.target as any).checked !== undefined && type === 'checkbox' ? (e.target as any).checked : value;
    setForm((prev: any) => ({ ...prev, [id]: val }));
  };

  const setStatus = (field: string, status: '✓' | 'X') => {
    setForm((prev: any) => ({ ...prev, [field]: status }));
    playSoundEffect('ui_click.mp3');
  };

  // Personnel Management
  const addPerson = () => {
    setPersonnel([...personnel, { id: Date.now().toString(), name: '', isCompany: false, roles: [], s_ic: '', s_sb: '', s_epf: '' }]);
    playSoundEffect('ui_click.mp3');
  };

  const removePerson = (id: string) => {
    setPersonnel(personnel.filter(p => id !== p.id));
    playSoundEffect('ui_click.mp3');
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setPersonnel(personnel.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // PDF & AI logic
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setIsAILoading(true);
    setLoadingProgress(5);
    
    try {
        setLoadingStep(0);
        const text = await pdfProcessor.extractText(file);
        setLoadingProgress(30);
        
        setLoadingStep(1);
        // Optional AI deep dive if provider set
        if (aiProvider !== 'manual') {
            setLoadingStep(2);
            const result = await apiService.processAI(text, 'borang', currentUser?.email || '');
            if (result.success) {
                setPdfExtracted(result.data);
                playSoundEffect('positive_chime.mp3');
            }
        } else {
            const data = pdfProcessor.extractDataSimple(text);
            setPdfExtracted(data);
            playSoundEffect('positive_chime.mp3');
        }
    } catch (error) {
        console.error("PDF Error:", error);
        playSoundEffect('error_buzz.mp3');
    } finally {
        setIsAILoading(false);
        setLoadingProgress(0);
    }
  };

  const applyAIData = () => {
    if (!pdfExtracted) return;
    setForm({
        ...form,
        borang_syarikat: pdfExtracted.companyName || form.borang_syarikat,
        borang_cidb: pdfExtracted.cidbNumber || form.borang_cidb,
        borang_gred: pdfExtracted.grade || form.borang_gred,
        // ... other mapping
    });
    
    if (pdfExtracted.directors) {
        const newPersonnel = pdfExtracted.directors.map((name: string) => ({
            id: Math.random().toString(),
            name: name.toUpperCase(),
            roles: ['PENGARAH'],
            s_ic: '', s_sb: '', s_epf: ''
        }));
        setPersonnel(newPersonnel);
    }
    
    setPdfExtracted(null);
    setPdfFileName('Tiada fail dipilih');
    playSoundEffect('positive_chime.mp3');
  };

  // Helper for dynamic colors
  const inputColor = (val: string) => cn(
    "form-input h-12 uppercase font-bold transition-all duration-300",
    !val ? "bg-amber-50 border-amber-300 text-amber-900 placeholder:text-amber-300" : "bg-green-50 border-green-400 text-green-900"
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      {/* AI Extraction Section */}
      <section className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-1000">
            <Sparkles size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="text-3xl font-black mb-2 tracking-tight">EKSTRAK BORANG PINTAR</h2>
            <p className="text-slate-400 font-medium mb-8">Gunakan kecerdasan buatan untuk mengisi borang dalam sekelip mata</p>
            
            <div className="flex gap-4 mb-10 items-center">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Model AI:</span>
                <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700 shadow-inner">
                    {['auto', 'manual', 'deepseek', 'gemini'].map(m => (
                        <button 
                            key={m}
                            onClick={() => setAiProvider(m)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all",
                                aiProvider === m ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Morphing Upload Box */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer group/upload"
            >
                <motion.div 
                    animate={isAILoading ? { 
                        borderRadius: ["50%", "20%", "50%"],
                        rotate: [0, 90, 0]
                    } : { 
                        borderRadius: "50%" 
                    }}
                    transition={{ duration: 2, repeat: isAILoading ? Infinity : 0 }}
                    className={cn(
                        "w-48 h-48 border-4 flex items-center justify-center relative overflow-hidden transition-all duration-500",
                        isAILoading ? "border-blue-500 bg-blue-500/20" : "border-slate-700 bg-slate-800 hover:border-blue-600 hover:bg-slate-700"
                    )}
                >
                    <div className="flex flex-col items-center">
                        {isAILoading ? (
                             <div className="text-3xl font-black">{loadingProgress}%</div>
                        ) : (
                            <>
                                <FileText size={48} className="text-blue-500 group-hover/upload:scale-110 transition-transform" />
                                <span className="text-[10px] font-black mt-2 uppercase tracking-widest text-slate-500">PILIH PDF</span>
                            </>
                        )}
                    </div>
                </motion.div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handlePdfUpload} accept=".pdf" />
                <p className="mt-6 font-bold text-blue-400 group-hover/upload:text-blue-300 transition-colors uppercase tracking-widest text-sm">
                    {pdfFileName}
                </p>
            </div>

            {/* AI Result Box */}
            <AnimatePresence>
                {pdfExtracted && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mt-10 bg-white text-slate-800 p-8 rounded-[2rem] w-full max-w-2xl text-left border-b-[6px] border-green-500 shadow-2xl"
                    >
                        <h3 className="text-xl font-black text-green-600 flex items-center gap-2 mb-6">
                            <Zap size={24} fill="currentColor" />
                            DATA BERJAYA DIEKSTRAK
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-8">
                            <div className="space-y-4">
                                <div><p className="text-[10px] font-black text-slate-400 uppercase">Syarikat</p><p className="font-bold border-b border-slate-100">{pdfExtracted.companyName}</p></div>
                                <div><p className="text-[10px] font-black text-slate-400 uppercase">No CIDB</p><p className="font-bold border-b border-slate-100">{pdfExtracted.cidbNumber}</p></div>
                            </div>
                            <div className="space-y-4">
                                <div><p className="text-[10px] font-black text-slate-400 uppercase">Gred</p><p className="font-bold border-b border-slate-100">{pdfExtracted.grade}</p></div>
                                <div><p className="text-[10px] font-black text-slate-400 uppercase">Personel</p><p className="font-bold border-b border-slate-100">{pdfExtracted.directors?.length || 0} Individu Dikesan</p></div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={applyAIData} className="flex-1 py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-200 hover:bg-green-700 transition-all active:scale-[0.98]">
                                ISI KE BORANG SEKARANG
                            </button>
                            <button onClick={() => { setPdfExtracted(null); setPdfFileName('Tiada fail dipilih'); }} className="px-6 py-4 bg-slate-100 text-slate-400 font-bold rounded-2xl hover:bg-slate-200 transition-all">
                                BATAL
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </section>

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Maklumat Asas */}
        <div className="lg:col-span-2 space-y-8">
            <Card title="🏢 MAKLUMAT ASAS SYARIKAT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Nama Syarikat</label>
                        <input id="borang_syarikat" value={form.borang_syarikat} onChange={handleChange} className={inputColor(form.borang_syarikat)} />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-2 block">No CIDB</label>
                        <input id="borang_cidb" value={form.borang_cidb} onChange={handleChange} className={inputColor(form.borang_cidb)} />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Gred</label>
                        <select id="borang_gred" value={form.borang_gred} onChange={handleChange} className={inputColor(form.borang_gred)}>
                            <option value="">PIlih Gred</option>
                            {['G1','G2','G3','G4','G5','G6','G7'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            <Card title="📁 SEMAKAN DOKUMEN SISTEM">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatusField id="doc_carta_status" label="Carta Organisasi" value={form.doc_carta_status} onSet={setStatus} />
                    <StatusField id="doc_peta_status" label="Peta Lakaran" value={form.doc_peta_status} onSet={setStatus} />
                    <StatusField id="doc_gambar_status" label="Gambar Premis" value={form.doc_gambar_status} onSet={setStatus} />
                    <StatusField id="doc_sewa_status" label="Perjanjian Sewa" value={form.doc_sewa_status} onSet={setStatus} />
                </div>
            </Card>

            <Card 
                title="👤 PENGURUSAN PERSONEL" 
                action={(
                    <button 
                        onClick={() => setShowQuickCheck(true)}
                        className="text-[10px] font-black px-4 py-2 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1 hover:bg-amber-200 transition-colors uppercase tracking-widest"
                    >
                        <Zap size={12} fill="currentColor" /> SEMAK CEPAT
                    </button>
                )}
            >
                <div className="space-y-4">
                    {personnel.map((p, index) => (
                        <div key={p.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 relative group/p">
                            <button 
                                onClick={() => removePerson(p.id)}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 text-red-600 rounded-full items-center justify-center hidden group-hover/p:flex shadow-md"
                            >
                                <Trash2 size={16} />
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <div className="flex justify-between mb-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Nama Personel #{index + 1}</label>
                                        <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={p.isCompany} 
                                                onChange={(e) => updatePerson(p.id, { isCompany: e.target.checked })} 
                                                className="w-3 h-3 rounded"
                                            /> Syarikat?
                                        </label>
                                    </div>
                                    <input 
                                        value={p.name} 
                                        onChange={(e) => updatePerson(p.id, { name: e.target.value.toUpperCase() })}
                                        placeholder="NAMA PENUH"
                                        className={cn("form-input h-10 font-bold", !p.name ? "bg-white" : "bg-blue-50 border-blue-200 text-blue-900")}
                                    />
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {['PENGARAH', 'P.EKUITI', 'P.SPKK', 'T.T CEK'].map(role => (
                                            <button 
                                                key={role}
                                                onClick={() => {
                                                    const newRoles = p.roles.includes(role) 
                                                        ? p.roles.filter(r => r !== role) 
                                                        : [...p.roles, role];
                                                    updatePerson(p.id, { roles: newRoles });
                                                }}
                                                className={cn(
                                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    p.roles.includes(role) ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-400 border border-slate-100"
                                                )}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <MiniStatusField label="IC" value={p.s_ic} onSet={(v) => updatePerson(p.id, { s_ic: v })} />
                                    <MiniStatusField label="SB" value={p.s_sb} onSet={(v) => updatePerson(p.id, { s_sb: v })} />
                                    <MiniStatusField label="EPF" value={p.s_epf} onSet={(v) => updatePerson(p.id, { s_epf: v })} />
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button 
                        onClick={addPerson}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        <Plus size={16} strokeWidth={3} /> TAMBAH PERSONEL
                    </button>
                </div>
            </Card>
        </div>

        {/* Right Column: Tarikh & Syor */}
        <div className="space-y-8">
            <Card title="⏳ TEMPOH & TARIKH">
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Tarikh Mohon</label>
                        <input id="borang_tarikh_mohon" type="date" value={form.borang_tarikh_mohon} onChange={handleChange} className={inputColor(form.borang_tarikh_mohon)} />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Durasi SPKK</label>
                        <input id="spkkDuration" value={form.spkkDuration} onChange={handleChange} placeholder="DD/MM/YYYY - DD/MM/YYYY" className={inputColor(form.spkkDuration)} />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Durasi STB</label>
                        <input id="stbDuration" value={form.stbDuration} onChange={handleChange} placeholder="DD/MM/YYYY - DD/MM/YYYY" className={inputColor(form.stbDuration)} />
                    </div>
                </div>
            </Card>

            <Card title="⚖️ KEPUTUSAN SYOR">
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Syor Pengesyor</label>
                        <select id="borang_syor_pengesyor" value={form.borang_syor_pengesyor} onChange={handleChange} className={inputColor(form.borang_syor_pengesyor)}>
                            <option value="">Pilih Keputusan</option>
                            <option value="SOKONG">SOKONG</option>
                            <option value="TIDAK DISOKONG">TIDAK DISOKONG</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Justifikasi</label>
                        <textarea id="borang_justifikasi" value={form.borang_justifikasi} onChange={handleChange} className={cn(inputColor(form.borang_justifikasi), "h-32 resize-none pt-3")} placeholder="Nyatakan sebab..." />
                    </div>
                </div>
            </Card>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-[100]">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-4">
            <button 
                onClick={() => {
                    if (window.confirm("Padam semua data?")) {
                        setForm({}); setPersonnel([]); setPdfExtracted(null);
                    }
                }}
                className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm"
            >
                <RotateCcw size={24} />
            </button>
            
            <div className="flex-1 flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-800 text-white font-black rounded-3xl shadow-xl hover:bg-slate-900 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-sm">
                    <Printer size={20} /> CETAK
                </button>
                <button 
                    onClick={() => setActiveTab('database')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-sm"
                >
                    <Save size={20} /> SIMPAN KE DB
                </button>
            </div>
        </div>
      </div>

      {/* Quick Check Modal */}
      <CustomQuickCheck 
        isOpen={showQuickCheck} 
        onClose={() => setShowQuickCheck(false)}
        personnel={personnel}
        onUpdate={updatePerson}
      />
    </div>
  );
};

// Internal Components
const Card: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-8 border-b-2 border-slate-50 pb-4">
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">{title}</h2>
            {action}
        </div>
        <div>{children}</div>
    </div>
);

const StatusField: React.FC<{ id: string; label: string; value: string; onSet: (id: string, v: '✓' | 'X') => void }> = ({ id, label, value, onSet }) => (
    <div className="space-y-2">
        <label className="text-xs font-black uppercase text-slate-400 px-1">{label}</label>
        <div className="relative group/field">
            <input 
                id={id} 
                readOnly 
                value={value} 
                className={cn(
                    "form-input h-14 font-black transition-all text-center text-xl",
                    !value ? "bg-slate-100 border-slate-200" : (value === '✓' ? "bg-green-100 border-green-400 text-green-700" : "bg-red-100 border-red-400 text-red-700")
                )} 
            />
            <div className="absolute right-2 top-2 bottom-2 flex gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity">
                <button onClick={() => onSet(id, '✓')} className="w-10 bg-green-500 text-white rounded-lg flex items-center justify-center hover:scale-105 active:scale-90 transition-transform"><Check size={20} strokeWidth={4} /></button>
                <button onClick={() => onSet(id, 'X')} className="w-10 bg-red-500 text-white rounded-lg flex items-center justify-center hover:scale-105 active:scale-90 transition-transform"><XIcon size={20} strokeWidth={4} /></button>
            </div>
        </div>
    </div>
);

const MiniStatusField: React.FC<{ label: string; value: string; onSet: (v: '✓' | 'X') => void }> = ({ label, value, onSet }) => (
    <div className="flex items-center gap-3">
        <span className="w-8 text-[9px] font-black text-slate-400 uppercase">{label}</span>
        <div className="flex-1 flex gap-1 h-8">
            <button 
                onClick={() => onSet('✓')}
                className={cn(
                    "flex-1 rounded-lg border-2 transition-all flex items-center justify-center font-black text-xs",
                    value === '✓' ? "bg-green-500 border-green-500 text-white" : "border-slate-100 bg-white text-slate-200 hover:border-green-200"
                )}
            >✓</button>
            <button 
                onClick={() => onSet('X')}
                className={cn(
                    "flex-1 rounded-lg border-2 transition-all flex items-center justify-center font-black text-xs",
                    value === 'X' ? "bg-red-500 border-red-500 text-white" : "border-slate-100 bg-white text-slate-200 hover:border-red-200"
                )}
            >✗</button>
        </div>
    </div>
);

// Quick Check Component
const CustomQuickCheck: React.FC<{ isOpen: boolean; onClose: () => void; personnel: Person[]; onUpdate: (id: string, updates: Partial<Person>) => void }> = ({ isOpen, onClose, personnel, onUpdate }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" 
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-8 border-b bg-amber-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-amber-900 tracking-tight flex items-center gap-3">
                                    <Zap fill="currentColor" size={28} /> 
                                    SEMAKAN PANTAS PERSONEL
                                </h3>
                                <p className="text-amber-700 font-bold text-xs uppercase tracking-widest mt-1">Kemaskini status dokumen secara pukal</p>
                            </div>
                            <button onClick={onClose} className="p-3 bg-white text-amber-900 rounded-2xl shadow-sm hover:scale-110 transition-transform"><XIcon size={24} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {personnel.map(p => (
                                <div key={p.id} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="md:col-span-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Nama</p>
                                        <p className="font-bold truncate text-slate-800">{p.name || 'TIADA NAMA'}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <MiniStatusField label="IC" value={p.s_ic} onSet={(v) => onUpdate(p.id, { s_ic: v })} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <MiniStatusField label="SB" value={p.s_sb} onSet={(v) => onUpdate(p.id, { s_sb: v })} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                         <MiniStatusField label="EPF" value={p.s_epf} onSet={(v) => onUpdate(p.id, { s_epf: v })} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-8 bg-slate-50 border-t flex justify-end">
                            <button onClick={onClose} className="px-12 py-4 bg-slate-800 text-white font-black rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-95 uppercase tracking-widest text-sm">
                                SELESAI & SIMPAN
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
