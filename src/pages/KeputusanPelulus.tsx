import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Send, 
  ArrowLeft,
  Calendar,
  FileText,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const KeputusanPelulus: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedRecord, setActiveTab, playSoundEffect, refreshData } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [changeSyor, setChangeSyor] = useState('TIDAK');
  const [spiDate, setSpiDate] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (selectedRecord) {
        setDecision('');
        setReason('');
        setCustomReason('');
        setChangeSyor('TIDAK');
        setSpiDate('');
        setConfirmed(false);
    }
  }, [selectedRecord]);

  if (!selectedRecord) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <AlertCircle size={64} className="text-slate-200 mb-6" />
            <h2 className="text-2xl font-black text-slate-800 uppercase">Tiada Rekod Untuk Diluluskan</h2>
            <p className="text-slate-500 mt-2 mb-8">Sila pilih permohonan dari tab Inbox Pelulus.</p>
            <button 
                onClick={() => setActiveTab('senarai')}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:scale-105 transition-all uppercase tracking-widest text-xs"
            >
                Ke Inbox Pelulus
            </button>
        </div>
    );
  }

  const handleSubmit = async () => {
    if (!decision) return alert("Sila pilih keputusan!");
    if ((decision === 'TOLAK' || decision === 'SIASAT') && !reason) return alert("Sila pilih alasan!");
    if (reason === 'Lain-lain' && !customReason) return alert("Sila nyatakan alasan lain!");
    if (changeSyor === 'YA' && !spiDate) return alert("Sila masukkan tarikh hantar ke SPI!");
    if (!confirmed) return alert("Sila tanda kotak pengesahan!");

    setLoading(true);
    playSoundEffect('ui_click.mp3');

    try {
        const finalReason = reason === 'Lain-lain' ? customReason : reason;
        const payload = {
            action: 'updateRecord',
            row: selectedRecord.row,
            kelulusan: decision,
            alasan: finalReason,
            syor_lawatan: changeSyor === 'YA' ? 'YA' : selectedRecord.syor_lawatan_tapak,
            tarikh_spi: spiDate,
            nama_pelulus: currentUser?.name || '',
            email: currentUser?.email || ''
        };

        const res = await apiService.saveRecord(payload);
        if (res.success) {
            playSoundEffect('positive_chime.mp3');
            alert("Keputusan berjaya dihantar!");
            await refreshData();
            setActiveTab('senarai');
        } else {
            throw new Error(res.error || "Ralat tidak diketahui");
        }
    } catch (e) {
        alert("Ralat mengemaskini rekod.");
        playSoundEffect('error_buzz.mp3');
    } finally {
        setLoading(false);
    }
  };

  const tolakReasons = [
    "Syarikat Belum Cukup Tempoh 1 Tahun dari Tarikh Kelulusan CIDB",
    "Kegagalan Mengemukakan Dokumen Yang Diperlukan",
    "Ketidakpatuhan Syarat-Syarat AM Pendaftaran Syarikat",
    "Rekod Buruk Dalam Pendaftaran Terdahulu",
    "Lain-lain"
  ];

  const siasatReasons = [
    "Alamat Perniagaan Diragui",
    "Kesahihan Dokumen Perlu Disahkan Semula",
    "Perlu Temujanji Bersama Pengarah",
    "Lain-lain"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20">
      <LoadingOverlay isVisible={loading} message="Menyimpan Keputusan..." />

      <header className="flex items-center gap-4">
        <button 
            onClick={() => setActiveTab('senarai')}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm transition-all"
        >
            <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Keputusan Pelulus</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{selectedRecord.nama_syarikat}</p>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Record Overview Summary */}
        <section className="bg-slate-800 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-6 items-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                    <FileText size={32} className="text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">{selectedRecord.jenis}</h3>
                    <p className="text-blue-300 font-mono text-xs tracking-widest">{selectedRecord.no_pendaftaran || '-'}</p>
                </div>
            </div>
            <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">DAERAH</span>
                <span className="text-xl font-black uppercase tracking-widest">{selectedRecord.daerah}</span>
            </div>
        </section>

        {/* Decision Form */}
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-10">
            {/* 1. Kelulusan */}
            <div className="space-y-6 text-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-600" /> 1. PILIH KEPUTUSAN
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { id: 'LULUS', label: 'LULUS', color: 'bg-green-600', icon: <CheckCircle2 /> },
                        { id: 'TOLAK', label: 'TOLAK', color: 'bg-red-600', icon: <XCircle /> },
                        { id: 'SIASAT', label: 'SIASAT', color: 'bg-orange-500', icon: <HelpCircle /> }
                    ].map(opt => (
                        <button 
                            key={opt.id}
                            onClick={() => {
                                setDecision(opt.id);
                                setReason('');
                                playSoundEffect('ui_click.mp3');
                            }}
                            className={cn(
                                "flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all group",
                                decision === opt.id 
                                    ? `${opt.color} text-white border-transparent shadow-xl scale-105` 
                                    : "border-slate-50 text-slate-400 hover:border-slate-200"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                                decision === opt.id ? "bg-white/20 text-white" : "bg-slate-50 text-slate-300 group-hover:bg-slate-100"
                            )}>
                                {opt.icon}
                            </div>
                            <span className="font-black tracking-widest uppercase text-xs">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Alasan (Dynamic) */}
            {(decision === 'TOLAK' || decision === 'SIASAT') && (
                <div className="space-y-6 animate-scaleIn">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600" /> 2. PILIH ALASAN {decision}
                    </h3>
                    <select 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold uppercase text-xs focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                    >
                        <option value="">-- PILIH ALASAN --</option>
                        {(decision === 'TOLAK' ? tolakReasons : siasatReasons).map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>

                    {reason === 'Lain-lain' && (
                        <textarea 
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Sila nyatakan alasan anda..."
                            className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold uppercase text-xs focus:ring-4 focus:ring-red-500/10 outline-none transition-all h-32"
                        />
                    )}
                </div>
            )}

            {/* 3. Tukar Syor */}
            <div className="space-y-6 border-t pt-10">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-600" /> 3. TUKAR SYOR LAWATAN?
                </h3>
                <div className="bg-slate-50 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-bold text-slate-500 uppercase leading-snug">
                        Syor Asal: <span className="text-slate-800">{selectedRecord.syor_lawatan_tapak || '-'}</span>
                    </p>
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
                        {['YA', 'TIDAK'].map(opt => (
                            <button 
                                key={opt}
                                onClick={() => setChangeSyor(opt)}
                                className={cn(
                                    "px-8 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all",
                                    changeSyor === opt ? "bg-slate-800 text-white shadow-lg" : "text-slate-400"
                                )}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {changeSyor === 'YA' && (
                    <div className="animate-scaleIn space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                           <Calendar size={12} /> Tarikh Submit ke SPI (PENTING)
                        </label>
                        <input 
                            type="date"
                            value={spiDate}
                            onChange={(e) => setSpiDate(e.target.value)}
                            className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold uppercase text-xs focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                )}
            </div>

            {/* 4. Confirmation */}
            <div className="space-y-6 border-t pt-10">
                <label className="flex items-start gap-4 p-6 bg-blue-50 rounded-3xl border border-blue-100 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                        <p className="text-[11px] font-black text-blue-900 uppercase tracking-tighter leading-tight group-hover:text-blue-800 transition-colors">
                            Dengan ini saya mengesahkan keputusan bagi permohonan syarikat ini adalah sahih berdasarkan semakan yang telah dilakukan.
                        </p>
                    </div>
                </label>

                <button 
                    onClick={handleSubmit}
                    className="w-full py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm"
                >
                    Hantar Keputusan Rasmi <Send size={20} />
                </button>
            </div>
        </section>
      </main>
    </div>
  );
};
