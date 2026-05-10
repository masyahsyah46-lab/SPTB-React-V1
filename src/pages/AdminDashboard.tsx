import React, { useMemo } from 'react';
import { 
  Trophy, 
  Target, 
  BarChart3, 
  PieChart, 
  Download, 
  Printer, 
  Users, 
  TrendingUp,
  FileText,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { cachedData, playSoundEffect } = useAppContext();

  const stats = useMemo(() => {
    const res = {
      total: cachedData.length,
      lulus: 0,
      tolak: 0,
      pending: 0,
      baru: 0,
      pembaharuan: 0,
      pengesyorStats: {} as any,
      pelulusStats: {} as any,
      rejectionReasons: {} as any,
      typeStats: {} as any
    };

    cachedData.forEach(item => {
      const status = item.kelulusan || '';
      const type = item.jenis?.toUpperCase() || 'LAIN';
      const pengesyor = item.nama_pengesyor || 'TIADA';
      const pelulus = item.nama_pelulus || 'TIADA';
      const reason = item.alasan || 'TIADA NYATA';

      if (status.includes('LULUS')) res.lulus++;
      else if (status.includes('TOLAK') || status.includes('SIASAT')) {
          res.tolak++;
          res.rejectionReasons[reason] = (res.rejectionReasons[reason] || 0) + 1;
      }
      else res.pending++;

      if (type === 'BARU') res.baru++;
      else res.pembaharuan++;

      res.typeStats[type] = (res.typeStats[type] || 0) + 1;

      // Stats by Pengesyor
      if (!res.pengesyorStats[pengesyor]) {
          res.pengesyorStats[pengesyor] = { total: 0, sokong: 0, tidak: 0 };
      }
      res.pengesyorStats[pengesyor].total++;
      if (status.includes('DISYOR')) res.pengesyorStats[pengesyor].sokong++;
      
      // Stats by Pelulus
      if (pelulus !== 'TIADA') {
          if (!res.pelulusStats[pelulus]) {
              res.pelulusStats[pelulus] = { total: 0, lulus: 0, tolak: 0 };
          }
          res.pelulusStats[pelulus].total++;
          if (status.includes('LULUS')) res.pelulusStats[pelulus].lulus++;
          else res.pelulusStats[pelulus].tolak++;
      }
    });

    return res;
  }, [cachedData]);

  const handleExportCSV = () => {
    playSoundEffect('ui_click.mp3');
    if (cachedData.length === 0) return;
    
    const headers = Object.keys(cachedData[0]);
    const csvRows = [
      headers.join(','),
      ...cachedData.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Laporan_SPTB_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderStatCard = (title: string, value: number, sub: string, color: string, icon: React.ReactNode) => (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-5 rounded-bl-[4rem] transition-all group-hover:scale-110", color)} />
        <div className="relative z-10">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg", color.replace('bg-', 'bg-opacity-20 text-').replace('text-', 'text-'))}>
                {icon}
            </div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800">{value}</span>
                <span className="text-xs font-bold text-slate-400 lowercase">{sub}</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Admin Management</h1>
            <p className="text-slate-500 font-medium">Laporan analitik dan statistik keseluruhan sistem</p>
        </div>
        <div className="flex gap-4">
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 uppercase tracking-widest text-xs">
                <Download size={18} /> Export CSV
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-4 bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-900 transition-all active:scale-95 uppercase tracking-widest text-xs">
                <Printer size={18} /> Cetak Laporan
            </button>
        </div>
      </header>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStatCard("JUMLAH KES", stats.total, "permohonan", "bg-blue-600", <BarChart3 />)}
        {renderStatCard("LULUS", stats.lulus, "diluluskan", "bg-emerald-600", <Trophy />)}
        {renderStatCard("TOLAK/SIASAT", stats.tolak, "ditolak", "bg-red-600", <AlertOctagon />)}
        {renderStatCard("DALAM PROSES", stats.pending, "menunggu", "bg-orange-500", <Users />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pengesyor Stats */}
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
            <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TrendingUp size={18} className="text-blue-600" />
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Statistik Mengikut Pengesyor</h2>
                </div>
            </div>
            <div className="p-0">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                            <th className="px-8 py-4">Nama Pengesyor</th>
                            <th className="px-4 py-4 text-center">Jumlah</th>
                            <th className="px-4 py-4 text-center">Disyor</th>
                            <th className="px-8 py-4 text-right">Kadar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-xs font-bold">
                        {Object.entries(stats.pengesyorStats).map(([name, data]: [string, any], idx) => {
                            const rate = Math.round((data.sokong / data.total) * 100);
                            return (
                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-8 py-4 text-slate-700 uppercase">{name}</td>
                                    <td className="px-4 py-4 text-center text-slate-400">{data.total}</td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[9px] font-black">{data.sokong}</span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 text-emerald-600">
                                            {rate}% <ChevronRight size={12} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>

        {/* Pelulus Stats */}
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
            <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Prestasi Keputusan Pelulus</h2>
                </div>
            </div>
            <div className="p-0">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                            <th className="px-8 py-4">Nama Pelulus</th>
                            <th className="px-4 py-4 text-center">Jumlah</th>
                            <th className="px-4 py-4 text-center">Lulus</th>
                            <th className="px-8 py-4 text-right">Tolak</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-xs font-bold">
                        {Object.entries(stats.pelulusStats).map(([name, data]: [string, any], idx) => (
                            <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="px-8 py-4 text-slate-700 uppercase">{name}</td>
                                <td className="px-4 py-4 text-center text-slate-400">{data.total}</td>
                                <td className="px-4 py-4 text-center text-emerald-600">{data.lulus}</td>
                                <td className="px-8 py-4 text-right text-red-600">{data.tolak}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>

        {/* Rejection Analysis */}
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden h-fit lg:col-span-2">
            <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertCircle size={18} className="text-red-600" />
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Analisis Alasan Penolakan / Siasatan</h2>
                </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Jenis Permohonan</h4>
                    {Object.entries(stats.typeStats).map(([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                            <span className="text-[11px] font-black uppercase text-slate-600">{type}</span>
                            <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-slate-800 shadow-sm">{count}</span>
                        </div>
                    ))}
                </div>
                <div className="md:col-span-2 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Alasan Terbanyak</h4>
                    <div className="space-y-3">
                        {Object.entries(stats.rejectionReasons).sort((a:any, b:any) => b[1] - a[1]).slice(0, 5).map(([reason, count]: [string, any], idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1.5 px-1">
                                        <span className="text-[10px] font-black text-slate-700 uppercase line-clamp-1">{reason}</span>
                                        <span className="text-[10px] font-black text-slate-400">{count} KES</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-red-500 rounded-full transition-all duration-1000" 
                                            style={{ width: `${(count / stats.tolak) * 100}%` }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

import { ShieldCheck, AlertCircle } from 'lucide-react';
