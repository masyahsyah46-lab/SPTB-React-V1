import React, { useState } from 'react';
import { 
  Youtube, 
  Search, 
  Play, 
  Music, 
  ChevronLeft,
  Volume2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { apiService } from '../services/apiService';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const PortalYoutube: React.FC = () => {
  const { playSoundEffect, setActiveTab, sfxVolume, setSfxVolume } = useAppContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    playSoundEffect('ui_click.mp3');
    try {
        const res = await apiService.searchYoutube(query);
        if (res.success) {
            setResults(res.data);
            playSoundEffect('positive_chime.mp3');
        }
    } catch (e) {
        console.error("Youtube Search Error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      <LoadingOverlay isVisible={loading} message="Mencari di YouTube..." steps={['Menghubungi API...', 'Memuatkan video...']} currentStep={results.length > 0 ? 1 : 0} />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                <Youtube size={40} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Portal Muzik & Video</h1>
                <p className="text-slate-500 font-medium italic">Sistem Bersepadu SPTB (HQ) Multimedia</p>
            </div>
        </div>
        <button onClick={() => setActiveTab('dashboard')} className="px-6 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest text-xs">
            <ChevronLeft size={16} /> Kembali Bekerja
        </button>
      </header>

      {/* Audio Controls */}
      <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-8">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Volume2 size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume Kesan Bunyi (SFX)</p>
                <div className="flex items-center gap-4">
                    <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={sfxVolume} 
                        onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                        className="w-32 accent-red-600 h-1.5"
                    />
                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black">{Math.round(sfxVolume * 100)}%</span>
                </div>
            </div>
        </div>
        <div className="hidden lg:block h-10 w-px bg-slate-100" />
        <div className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                <input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Cari tajuk lagu atau video..." 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none font-bold uppercase transition-all"
                />
            </div>
            <button onClick={handleSearch} className="px-8 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 uppercase tracking-widest text-xs">
                CARI
            </button>
        </div>
      </section>

      {/* Video Player */}
      {activeVideo && (
        <section className="bg-black rounded-[3rem] overflow-hidden shadow-2xl animate-scaleIn border-8 border-slate-900 aspect-video relative">
            <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`} 
                title="YouTube player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
            ></iframe>
        </section>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {results.map(item => (
            <div 
                key={item.id.videoId} 
                onClick={() => {
                    setActiveVideo(item.id.videoId);
                    playSoundEffect('ui_click.mp3');
                    window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="bg-white rounded-[2rem] p-4 border border-transparent hover:border-red-200 hover:shadow-xl hover:shadow-red-50 transition-all duration-500 cursor-pointer group"
            >
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-sm group-hover:scale-[1.02] transition-transform duration-500">
                    <img src={item.snippet.thumbnails.medium.url} className="w-full h-full object-cover" alt={item.snippet.title} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Play className="text-white" size={40} fill="currentColor" />
                    </div>
                </div>
                <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight uppercase group-hover:text-red-600 transition-colors">
                    {item.snippet.title}
                </h4>
                <div className="mt-3 flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                    <Music size={12} />
                    {item.snippet.channelTitle}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
