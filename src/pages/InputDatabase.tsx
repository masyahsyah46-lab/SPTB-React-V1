import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FolderPlus, 
  Share2, 
  Save, 
  ExternalLink, 
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { motion, AnimatePresence } from 'motion/react';

export const InputDatabase: React.FC = () => {
  const { currentUser } = useAuth();
  const { playSoundEffect } = useAppContext();
  
  const [form, setForm] = useState<any>({
    db_syarikat: '',
    db_cidb: '',
    db_gred: '',
    db_jenis: '',
    db_negeri: '',
    db_tarikh_surat: '',
    db_start_date: '',
    db_tatatertib: '',
    db_syor: '',
    db_pautan: '',
    db_justifikasi: '',
    db_syor_status: '',
    db_perubahan_input: '',
    db_sah_syor: false,
    cb_notify_whatsapp: false,
    db_pelulus_whatsapp: '',
    cb_create_folder: true,
    db_alamat_perniagaan: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStep, setSaveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [driveUrl, setDriveUrl] = useState('');
  const [approvers, setApprovers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await apiService.getData('ADMIN');
        const pelulus = users.filter((u: any) => u.role === 'PELULUS');
        setApprovers(pelulus);
      } catch (e) {
        console.error("Failed to load approvers");
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as any).checked : value;
    setForm((prev: any) => ({ ...prev, [id]: val }));
  };

  const handleSave = async () => {
    if (!form.db_syarikat || !form.db_jenis) {
        alert("Sila isi Nama Syarikat dan Jenis Permohonan!");
        return;
    }

    setIsSaving(true);
    setProgress(10);
    setSaveStep(0);
    playSoundEffect('ui_click.mp3');

    try {
        if (form.cb_create_folder && !driveUrl) {
            setProgress(30);
            setSaveStep(1);
            const driveRes = await apiService.createDriveFolder(
                form.db_syarikat, 
                form.db_jenis, 
                currentUser?.name || '', 
                currentUser?.email || ''
            );
            if (driveRes.success) {
                setDriveUrl(driveRes.folder_url);
                form.db_pautan = driveRes.folder_url;
            }
        }

        setProgress(70);
        setSaveStep(2);
        
        const payload = {
            ...form,
            email: currentUser?.email,
            pengesyor: currentUser?.name,
            tarikh_syor: form.db_sah_syor ? new Date().toISOString().split('T')[0] : ''
        };

        const response = await apiService.saveRecord(payload);
        
        if (response.status === 'success') {
            setProgress(100);
            playSoundEffect('positive_chime.mp3');
            
            if (form.cb_notify_whatsapp && form.db_pelulus_whatsapp) {
                const waMsg = `*NOTIFIKASI PERMOHONAN STB*\\nSyarikat: ${form.db_syarikat}\\nJenis: ${form.db_jenis}\\nStatus: ${form.db_syor_status}\\n\\nSila semak sistem untuk tindakan selanjutnya.`;
                const waUrl = `https://wa.me/${form.db_pelulus_whatsapp.replace(/\\D/g, '')}?text=${encodeURIComponent(waMsg)}`;
                window.open(waUrl, '_blank');
            }
            alert("Rekod berjaya disimpan!");
        }
    } catch (e) {
        playSoundEffect('error_buzz.mp3');
        alert("Gagal menyimpan rekod.");
    } finally {
        setTimeout(() => {
            setIsSaving(false);
            setProgress(0);
        }, 1000);
    }
  };

  const inputColor = (val: any) => cn(
    "form-input h-12 uppercase font-bold transition-all duration-300",
    !val ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-green-50 border-green-400 text-green-900"
  );

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <LoadingOverlay isVisible={isSaving} message="Memproses Penyimpanan..." progress={progress} steps={['Drive...', 'Sheet...', 'WhatsApp...']} currentStep={saveStep} />
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center gap-6 mb-10">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Database size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">INPUT DATABASE</h1>
                <p className="text-slate-500 font-medium">Langkah terakhir untuk memasukkan data ke pangkalan data KUSKOP</p>
            </div>
        </div>

        <section className={cn("p-8 rounded-[2.5rem] border-2 transition-all duration-500", form.cb_create_folder ? "bg-blue-600 text-white border-blue-400 shadow-xl" : "bg-white border-slate-100")}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <FolderPlus size={32} />
                    <h3 className="text-xl font-black">INTEGRASI GOOGLE DRIVE</h3>
                </div>
                <input type="checkbox" id="cb_create_folder" checked={form.cb_create_folder} onChange={handleChange} className="w-6 h-6" />
            </div>
            {driveUrl && <div className="mt-4 p-4 bg-white/20 rounded-xl flex justify-between items-center gap-2">
                <span className="truncate flex-1">{driveUrl}</span>
                <a href={driveUrl} target="_blank" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-xs">BUKA</a>
            </div>}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="🏢 BUTIRAN PERMOHONAN">
                <div className="space-y-4">
                    <input id="db_syarikat" placeholder="Syarikat" value={form.db_syarikat} onChange={handleChange} className={inputColor(form.db_syarikat)} />
                    <input id="db_cidb" placeholder="No CIDB" value={form.db_cidb} onChange={handleChange} className={inputColor(form.db_cidb)} />
                    <div className="grid grid-cols-2 gap-4">
                        <select id="db_gred" value={form.db_gred} onChange={handleChange} className={inputColor(form.db_gred)}>
                            <option value="">Gred</option>
                            {['G1','G2','G3','G4','G5','G6','G7'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select id="db_jenis" value={form.db_jenis} onChange={handleChange} className={inputColor(form.db_jenis)}>
                            <option value="">Jenis</option>
                            {['BARU','PEMBAHARUAN','UBAH MAKLUMAT','UBAH GRED'].map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                    </div>
                    {(form.db_jenis === 'UBAH MAKLUMAT' || form.db_jenis === 'UBAH GRED') && (
                        <input id="db_perubahan_input" value={form.db_perubahan_input} onChange={handleChange} placeholder="Perincian Perubahan..." className="form-input bg-amber-50 border-amber-300" />
                    )}
                </div>
            </Card>

            <Card title="📅 TARIKH & PENILAIAN">
                <div className="space-y-4">
                    <input id="db_start_date" type="date" value={form.db_start_date} onChange={handleChange} className={inputColor(form.db_start_date)} />
                    <select id="db_syor" value={form.db_syor} onChange={handleChange} className={inputColor(form.db_syor)}>
                        <option value="">Syor Lawatan</option>
                        <option value="YA">YA</option><option value="TIDAK">TIDAK</option><option value="PEMUTIHAN">PEMUTIHAN</option>
                    </select>
                    <select id="db_syor_status" value={form.db_syor_status} onChange={handleChange} className={inputColor(form.db_syor_status)}>
                        <option value="">Status</option>
                        <option value="SOKONG">SOKONG</option><option value="TIDAK DISOKONG">TIDAK DISOKONG</option>
                    </select>
                    <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer">
                        <input type="checkbox" id="db_sah_syor" checked={form.db_sah_syor} onChange={handleChange} />
                        <span className="text-[10px] font-bold uppercase">Sahkan rekod adalah tepat</span>
                    </label>
                </div>
            </Card>
        </div>

        <Card title="💬 NOTIFIKASI WHATSAPP">
            <div className="space-y-4">
                <label className="flex items-center gap-2">
                    <input type="checkbox" id="cb_notify_whatsapp" checked={form.cb_notify_whatsapp} onChange={handleChange} />
                    <span>Hantar Notifikasi WhatsApp</span>
                </label>
                <AnimatePresence>
                {form.cb_notify_whatsapp && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <select id="db_pelulus_whatsapp" value={form.db_pelulus_whatsapp} onChange={handleChange} className="form-input bg-green-50 border-green-200 uppercase font-bold">
                            <option value="">Pilih Pelulus</option>
                            {approvers.map(a => <option key={a.email} value={a.phone}>{a.name} ({a.phone})</option>)}
                        </select>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </Card>

        <button onClick={handleSave} disabled={isSaving || !form.db_sah_syor} className={cn("w-full py-6 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3", form.db_sah_syor ? "bg-slate-800 text-white shadow-2xl" : "bg-slate-100 text-slate-300 disabled:opacity-50")}>
            <Save size={24} /> SIMPAN & HANTAR KE SHEET
        </button>
      </div>
    </div>
  );
};

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 mb-6 border-b pb-2 uppercase tracking-tight">{title}</h2>
        <div>{children}</div>
    </div>
);
