import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  Upload, 
  Filter, 
  ShoppingCart, 
  CheckCircle2, 
  MapPin,
  Tag
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../services/firebaseService';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface ExcelItem {
  id: number;
  company: string;
  cidb: string;
  district: string;
  grade: string;
  dateSubmitted: string;
  rawSortDate: Date;
  updateType: string;
  isAutoAssigned: boolean;
}

export const TapisanExcel: React.FC = () => {
  const { currentUser } = useAuth();
  const { playSoundEffect, cachedData, setActiveTab } = useAppContext();
  const [rawData, setRawData] = useState<ExcelItem[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [fileName, setPdfFileName] = useState('Tiada fail dipilih');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingType, setSavingType] = useState('BARU');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return '';
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  };

  const processExcel = (data: any[][]) => {
    if (data.length < 2) return;
    const headers = data[0].map(h => String(h).toLowerCase().trim());
    
    const keys = {
      company: headers.findIndex(h => h.includes('syarikat') || h.includes('company') || h.includes('nama')),
      grade: headers.findIndex(h => h.includes('gred') || h.includes('grade')),
      cidb: headers.findIndex(h => h.includes('cidb') || h.includes('reg')),
      district: headers.findIndex(h => h.includes('daerah') || h.includes('district') || h.includes('negeri')),
      date: headers.findIndex(h => h.includes('tarikh') || h.includes('date') || h.includes('submitted')),
      updateType: headers.findIndex(h => h.includes('update type') || h.includes('jenis perubahan'))
    };

    const gradeRegex = /^G[4-7]/i;
    const items: ExcelItem[] = data.slice(1).filter(row => {
      const g = String(row[keys.grade] || '').trim();
      return gradeRegex.test(g);
    }).map((row, idx) => {
      let dateStr = '-';
      let sortDate = new Date(0);
      if (row[keys.date]) {
        if (typeof row[keys.date] === 'number') {
          sortDate = new Date(Math.round((row[keys.date] - 25569) * 86400 * 1000));
          dateStr = sortDate.toLocaleDateString('en-GB');
        } else {
          dateStr = String(row[keys.date]);
          const parts = dateStr.split('/');
          if(parts.length === 3) sortDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
        }
      }

      const company = String(row[keys.company] || '-').trim().toUpperCase();
      const cidb = String(row[keys.cidb] || '-').trim();
      const lastDigit = cidb.slice(-1);
      const firstChar = company.charAt(0);

      // Auto Tapis Logic: Based on CIDB Last Digit and First Character
      // This is a representative rule - in a real app, these would come from the pengesyor's profile
      let autoAssign = false;
      if (currentUser?.role === 'PENGESYOR') {
          const assignedDigits = currentUser.assignedDigits || []; // e.g. ['1', '2', '3']
          const assignedChars = currentUser.assignedChars || []; // e.g. ['A', 'B', 'C']
          
          if (assignedDigits.length > 0 && assignedDigits.includes(lastDigit)) autoAssign = true;
          if (assignedChars.length > 0 && assignedChars.includes(firstChar)) autoAssign = true;
          
          // Fallback simple rule if no specific assignments: assign even/odd based on some logic
          if (assignedDigits.length === 0 && assignedChars.length === 0) {
              const codeNum = parseInt(currentUser.firebaseCode || '0') % 2;
              const digitNum = parseInt(lastDigit) % 2;
              if (codeNum === digitNum) autoAssign = true;
          }
      } else {
          autoAssign = true; // Admin/Superadmin see everything
      }

      return {
        id: idx,
        company,
        cidb,
        district: keys.district !== -1 ? String(row[keys.district] || '-').trim().toUpperCase() : '-',
        grade: String(row[keys.grade] || '-').trim().toUpperCase(),
        dateSubmitted: dateStr,
        rawSortDate: sortDate,
        updateType: keys.updateType !== -1 ? String(row[keys.updateType] || '-').trim() : '-',
        isAutoAssigned: autoAssign
      };
    });

    setRawData(items);
    const uniqueDistricts = Array.from(new Set(items.map(i => i.district))).filter(d => d !== '-').sort();
    setDistricts(uniqueDistricts);
    setSelectedDistricts(new Set(uniqueDistricts));
    playSoundEffect('positive_chime.mp3');

    if (currentUser?.role === 'PENGESYOR') {
        const assignedItems = items.filter(i => i.isAutoAssigned);
        setSelectedItems(new Set(assignedItems.map(i => i.id)));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        processExcel(data);
        setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const toggleDistrict = (d: string) => {
    const newSet = new Set(selectedDistricts);
    if (newSet.has(d)) newSet.delete(d);
    else newSet.add(d);
    setSelectedDistricts(newSet);
  };

  const filteredData = rawData.filter(i => selectedDistricts.has(i.district) || i.district === '-');

  const saveToBakul = async () => {
    if (selectedItems.size === 0) {
        alert("Sila pilih permohonan terlebih dahulu!");
        return;
    }
    setIsModalOpen(true);
  };

  const confirmSaveToBakul = async () => {
    setLoading(true);
    setIsModalOpen(false);
    try {
        const promises = Array.from(selectedItems).map(id => {
            const item = rawData.find(i => i.id === id);
            if (!item) return Promise.resolve();
            return addDoc(collection(db, "applications"), {
                company: item.company,
                cidb: item.cidb,
                grade: item.grade,
                district: item.district,
                type: savingType,
                dateSubmitted: item.dateSubmitted,
                sortableDate: Timestamp.fromDate(item.rawSortDate),
                status: 'Pending',
                processedBy: currentUser?.firebaseCode || '0000',
                processorName: currentUser?.name,
                createdAt: serverTimestamp(),
            });
        });

        await Promise.all(promises);
        playSoundEffect('positive_chime.mp3');
        setSelectedItems(new Set());
        setActiveTab('bakul');
    } catch (e) {
        alert("Ralat menyimpan ke bakul.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <LoadingOverlay isVisible={loading} message="Memproses Data Excel..." progress={loading ? 50 : 100} />
      
      {/* Modal Simpan Ke Bakul */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-8 text-blue-50">
                      <ShoppingCart size={120} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2 relative z-10">SIMPAN KE BAKUL</h2>
                  <p className="text-slate-400 font-medium mb-8 relative z-10 uppercase tracking-widest text-xs">Pilih jenis permohonan untuk {selectedItems.size} syarikat</p>
                  
                  <div className="space-y-3 mb-10 relative z-10">
                      {['BARU', 'PEMBAHARUAN', 'UBAH MAKLUMAT', 'UBAH GRED'].map(type => (
                          <button 
                            key={type}
                            onClick={() => setSavingType(type)}
                            className={cn(
                                "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all",
                                savingType === type ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                          >
                              <span className="font-black text-sm">{type}</span>
                              {savingType === type && <CheckCircle2 size={20} />}
                          </button>
                      ))}
                  </div>

                  <div className="flex gap-4 relative z-10">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600"
                      >
                          Batal
                      </button>
                      <button 
                        onClick={confirmSaveToBakul}
                        className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 uppercase tracking-widest text-xs hover:bg-blue-700 active:scale-95 transition-all"
                      >
                          Sahkan Simpan
                      </button>
                  </div>
              </motion.div>
          </div>
      )}
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <FileSpreadsheet size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">TAPISAN EXCEL</h1>
                <p className="text-slate-500 font-medium">Muat naik fail Excel CIDB untuk menapis permohonan</p>
            </div>
        </div>
      </header>

      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-center border-dashed border-2 border-slate-200">
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer group flex flex-col items-center"
        >
            <div className={cn(
                "w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-1000",
                loading && "morph-box bg-blue-600 text-white"
            )}>
                {loading ? <div className="text-xl font-black">AI</div> : <Upload size={40} />}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Pilih Fail Excel</h3>
            <p className="text-slate-400 font-medium text-sm mb-6 uppercase tracking-widest">{fileName}</p>
            <button className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95">
                PILIH FAIL
            </button>
            <input ref={fileInputRef} type="file" hidden onChange={handleFileUpload} accept=".xlsx, .xls" />
        </div>
      </section>

      {districts.length > 0 && (
        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <Filter size={20} className="text-blue-600" />
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">TAPIS MENGIKUT DAERAH</h2>
            </div>
            <div className="flex flex-wrap gap-2">
                {districts.map(d => (
                    <button 
                        key={d}
                        onClick={() => toggleDistrict(d)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            selectedDistricts.has(d) 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                                : "bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100"
                        )}
                    >
                        {d}
                    </button>
                ))}
            </div>
        </section>
      )}

      {filteredData.length > 0 && (
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black">{filteredData.length}</span>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">SENARAI PERMOHONAN</h2>
                </div>
                <button 
                    onClick={saveToBakul}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                    <ShoppingCart size={16} /> SIMPAN KE BAKUL ({selectedItems.size})
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                            <th className="px-8 py-4"><input type="checkbox" onChange={(e) => {
                                if (e.target.checked) setSelectedItems(new Set(filteredData.map(i => i.id)));
                                else setSelectedItems(new Set());
                            }} /></th>
                            <th className="px-4 py-4">Syarikat / CIDB</th>
                            <th className="px-4 py-4">Gred / Jenis</th>
                            <th className="px-4 py-4">Daerah</th>
                            <th className="px-4 py-4">Tarikh</th>
                            <th className="px-4 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {filteredData.map(item => {
                            const inDb = cachedData.some(c => c.cidb === item.cidb);
                            return (
                                <tr key={item.id} className={cn("hover:bg-blue-50/50 transition-colors", inDb && "opacity-50 grayscale bg-slate-50")}>
                                    <td className="px-8 py-4">
                                        <input 
                                            type="checkbox" 
                                            disabled={inDb}
                                            checked={selectedItems.has(item.id)} 
                                            onChange={() => {
                                                const newSet = new Set(selectedItems);
                                                if (newSet.has(item.id)) newSet.delete(item.id);
                                                else newSet.add(item.id);
                                                setSelectedItems(newSet);
                                            }}
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-bold text-slate-800 leading-tight">{item.company}</p>
                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{item.cidb}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black w-fit">{item.grade}</span>
                                            <span className="text-[10px] font-black text-blue-600">{item.updateType}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                            <MapPin size={12} />
                                            {item.district}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 font-bold text-slate-400 uppercase tracking-tighter">{item.dateSubmitted}</td>
                                    <td className="px-4 py-4 text-center">
                                        {inDb ? (
                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                                <CheckCircle2 size={12} /> TELAH ADA
                                            </span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">BARU</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
      )}
    </div>
  );
};
