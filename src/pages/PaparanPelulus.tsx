import React from 'react';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Tag, 
  Calendar, 
  User, 
  ShieldCheck, 
  FileText,
  BadgeInfo,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

export const PaparanPelulus: React.FC = () => {
  const { selectedRecord, setActiveTab, playSoundEffect } = useAppContext();

  if (!selectedRecord) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <BadgeInfo size={64} className="text-slate-200 mb-6" />
            <h2 className="text-2xl font-black text-slate-800 uppercase">Tiada Rekod Dipilih</h2>
            <p className="text-slate-500 mt-2 mb-8">Sila pilih permohonan dari senarai terlebih dahulu.</p>
            <button 
                onClick={() => setActiveTab('senarai')}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:scale-105 transition-all uppercase tracking-widest text-xs"
            >
                Ke Senarai Rekod
            </button>
        </div>
    );
  }

  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
    <div className="flex items-center gap-3 py-4 px-8 border-b bg-slate-50/50">
        <div className="text-blue-600">{icon}</div>
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">{title}</h3>
    </div>
  );

  const renderDataField = (label: string, value: string | undefined, fullWidth = false) => (
    <div className={cn("p-6 border-b border-r last:border-r-0 flex flex-col gap-1", fullWidth ? "col-span-full" : "col-span-1")}>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-tight">{label}</span>
        <span className="text-sm font-bold text-slate-700 uppercase">{value || '-'}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20">
      <header className="flex items-center justify-between">
        <button 
            onClick={() => setActiveTab('senarai')}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold uppercase tracking-widest text-[10px] transition-colors"
        >
            <ArrowLeft size={16} /> Kembali Ke Senarai
        </button>
        
        <div className={cn(
            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
            selectedRecord.kelulusan?.includes('LULUS') ? "bg-green-100 text-green-700" :
            selectedRecord.kelulusan?.includes('TOLAK') ? "bg-red-100 text-red-700" :
            "bg-blue-600 text-white"
        )}>
            {selectedRecord.kelulusan || 'PERLU SEMAKAN'}
        </div>
      </header>

      {/* Main Info Card */}
      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="bg-slate-800 p-12 text-white relative">
            <Building2 className="absolute top-10 right-10 w-32 h-32 text-white/5" />
            <div className="relative z-10">
                <div className="flex gap-2 mb-4">
                    <span className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{selectedRecord.jenis}</span>
                    <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase">GRED: {selectedRecord.gred}</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight uppercase mb-2">{selectedRecord.nama_syarikat}</h1>
                <p className="text-blue-300 font-mono text-sm tracking-[0.2em]">{selectedRecord.no_rujukan_cidb}</p>
            </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Section 1 */}
            <div className="col-span-full">{renderSectionHeader("Maklumat Permohonan", <FileText size={18} />)}</div>
            {renderDataField("Tarikh Masuk", selectedRecord.tarikh_masuk)}
            {renderDataField("Daerah", selectedRecord.daerah)}
            {renderDataField("No Pendaftaran", selectedRecord.no_pendaftaran)}
            {renderDataField("Gred / Kategori", `${selectedRecord.gred} / ${selectedRecord.kategori || '-'}`)}
            {renderDataField("Status Permohonan", selectedRecord.jenis)}
            {renderDataField("Alamat Perniagaan", selectedRecord.alamat_perniagaan, true)}

            {/* Section 2 */}
            <div className="col-span-full mt-4">{renderSectionHeader("Pematuhan Syarat & Lawatan", <ShieldCheck size={18} />)}</div>
            {renderDataField("Syor Lawatan Tapak", selectedRecord.syor_lawatan_tapak)}
            {renderDataField("Kategori Lawatan", selectedRecord.kategori_lawatan)}
            {renderDataField("Ulasan Pengesyor", selectedRecord.ulasan_pengesyor, true)}

            {/* Section 3 */}
            <div className="col-span-full mt-4">{renderSectionHeader("Keputusan Pelulus", <BadgeInfo size={18} />)}</div>
            {renderDataField("Status Kelulusan", selectedRecord.kelulusan)}
            {renderDataField("Nama Pelulus", selectedRecord.nama_pelulus)}
            {renderDataField("Tarikh Keputusan", selectedRecord.tarikh_kelulusan || selectedRecord.updatedAt)}
            {renderDataField("Alasan / Nota", selectedRecord.alasan, true)}
        </div>
      </section>

      {/* Footer Notes */}
      <div className="flex bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 items-start gap-4">
        <AlertTriangle className="text-blue-600 mt-1" size={20} />
        <div>
            <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Nota Penting</h4>
            <p className="text-xs text-blue-700 leading-relaxed">Paparannya adalah cermin dari pangkalan data utama. Segala perubahan yang dibuat menggunakan fungsi Keputusan Pelulus akan mengemaskini rekod ini secara kekal dalam sistem GAS.</p>
        </div>
      </div>
    </div>
  );
};
