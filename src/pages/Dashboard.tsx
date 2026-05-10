import React, { useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  ChartOptions,
  Plugin
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Phone,
  ClipboardList,
  Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// PENTING: Custom breathing plugin from original app.js
const alivePlugin: Plugin = {
  id: 'alive',
  beforeDraw: (chart) => {
    // @ts-ignore - access custom option
    if (chart.options.plugins?.alive?.enabled) {
      const timestamp = Date.now();
      const scale = 1 + Math.sin(timestamp / 1000) * 0.01;
      const ctx = chart.ctx;
      ctx.save();
      ctx.translate(chart.width / 2, chart.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-chart.width / 2, -chart.height / 2);
    }
  },
  afterDraw: (chart) => {
    // @ts-ignore - access custom option
    if (chart.options.plugins?.alive?.enabled) {
      chart.ctx.restore();
    }
  }
};

ChartJS.register(alivePlugin);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { dashboardData, cachedData, refreshData, setActiveTab } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    period: 'monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  const handleRefresh = async () => {
    setLoading(true);
    await refreshData();
    setLoading(false);
  };

  const stats = useMemo(() => {
    // Penapisan berdasarkan tempoh
    const now = new Date();
    const filtered = cachedData.filter(item => {
        if (!item.tarikh_mohon) return true;
        const d = new Date(item.tarikh_mohon);
        if (filter.period === 'monthly' && d.getMonth() + 1 !== filter.month) return false;
        if (filter.period === 'yearly' && d.getFullYear() !== filter.year) return false;
        return true;
    });

    return {
      total: filtered.length,
      lulus: filtered.filter(i => (i.kelulusan || '').includes('LULUS') || (i.kelulusan || '').includes('SOKONG')).length,
      tolak: filtered.filter(i => (i.kelulusan || '').includes('TOLAK') || (i.kelulusan || '').includes('SIASAT') || (i.kelulusan || '').includes('TIDAK DISOKONG')).length,
      proses: filtered.filter(i => !(i.kelulusan || '').includes('LULUS') && !(i.kelulusan || '').includes('SOKONG') && !(i.kelulusan || '').includes('TOLAK') && !(i.kelulusan || '').includes('SIASAT') && !(i.kelulusan || '').includes('TIDAK DISOKONG')).length,
      typeStats: filtered.reduce((acc: any, item) => {
        const type = (item.jenis || 'baru').toUpperCase();
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      consultationStats: filtered.reduce((acc: any, item) => {
        const platform = (item.db_konsultansi_platform || 'EMEL').toUpperCase();
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, { 'EMEL': 0, 'WHATSAPP': 0, 'PANGGILAN': 0 })
    };
  }, [cachedData, filter]);

  const consultationChartData = useMemo(() => ({
    labels: Object.keys(stats.consultationStats),
    datasets: [{
      label: 'Jenis Konsultansi',
      data: Object.values(stats.consultationStats),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      borderRadius: 8
    }]
  }), [stats]);

  const statusChartData = useMemo(() => ({
    labels: currentUser?.role === 'PENGESYOR' ? ['SOKONG', 'TIDAK SOKONG', 'PROSES'] : ['LULUS', 'TOLAK/SIASAT', 'PROSES'],
    datasets: [{
      data: [stats.lulus, stats.tolak, stats.proses],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'], // Biru/Hijau/Merah thematic
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverOffset: 15,
      borderRadius: 8
    }]
  }), [stats, currentUser]);

  const typeChartData = useMemo(() => {
    const labels = Object.keys(stats.typeStats);
    const data = Object.values(stats.typeStats);
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'], // Biru, Hijau, Kuning, Merah
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 15,
        borderRadius: 6
      }]
    };
  }, [stats]);

  const commonOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      // @ts-ignore
      alive: { enabled: true }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutElastic'
    }
  };

  const downloadCSV = () => {
    setLoading(true);
    setTimeout(() => {
        const headers = ['Syarikat', 'CIDB', 'Gred', 'Jenis', 'Status'];
        const rows = cachedData.map(item => [
            item.syarikat,
            item.cidb,
            item.gred,
            item.jenis,
            item.kelulusan || 'DALAM PROSES'
        ]);

        const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `dashboard_data_${filter.year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={32} />
            DASHBOARD ANALISIS
          </h1>
          <p className="text-slate-500 font-medium mt-1">Sistem Bersepadu Pengurusan Permohonan SPTB</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
            <select 
              value={filter.period}
              onChange={(e) => setFilter({...filter, period: e.target.value})}
              className="px-4 py-2 bg-transparent text-sm font-bold text-slate-700 outline-none"
            >
              <option value="daily">Harian</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
            <div className="w-px h-6 bg-slate-200" />
            <select className="px-4 py-2 bg-transparent text-sm font-bold text-slate-700 outline-none">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 px-6 py-3.5 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Download size={18} />
            Muat Turun CSV
          </button>
        </div>
      </div>

      {/* Role Info Bar */}
      <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
        <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Activity size={180} />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
            <Users size={32} />
          </div>
          <div>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-1">Status Pengguna Aktif</p>
            <h2 className="text-2xl font-black">{currentUser?.name}</h2>
            <p className="text-blue-50/80 font-medium">Log masuk sebagai <span className="font-black underline underline-offset-4">{currentUser?.role}</span></p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Jumlah Keseluruhan" value={stats.total} icon={<ClipboardList className="text-blue-600" />} />
        <StatCard title={currentUser?.role === 'PENGESYOR' ? 'Disokong' : 'Diluluskan'} value={stats.lulus} icon={<CheckCircle className="text-green-600" />} color="text-green-600" />
        <StatCard title={currentUser?.role === 'PENGESYOR' ? 'Ditolak' : 'Tolak/Siasat'} value={stats.tolak} icon={<XCircle className="text-red-600" />} color="text-red-600" />
        <StatCard title="Kadar Sokongan" value={`${stats.total > 0 ? Math.round((stats.lulus / stats.total) * 100) : 0}%`} icon={<Activity className="text-amber-600" />} color="text-amber-600" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title={currentUser?.role === 'PENGESYOR' ? 'Status Syor' : 'Status Kelulusan'}>
          <Doughnut data={statusChartData} options={{...commonOptions, cutout: '75%'}} />
        </ChartCard>

        <ChartCard title="Jenis Permohonan">
          <Doughnut data={typeChartData} options={{...commonOptions, cutout: '65%'}} />
        </ChartCard>

        <ChartCard title="Taburan Jenis Konsultansi">
          <Bar data={consultationChartData} options={commonOptions} />
        </ChartCard>

        <ChartCard title="Trend Bulanan" className="lg:col-span-2">
          <Line 
            data={{
              labels: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun'],
              datasets: [
                {
                  label: 'Permohonan',
                  data: [12, 19, 3, 5, 2, 3],
                  borderColor: '#3b82f6',
                  backgroundColor: '#3b82f644',
                  fill: true,
                  tension: 0.4
                }
              ]
            }} 
            options={commonOptions} 
          />
        </ChartCard>
      </div>

      {/* Reason Analysis */}
      {(currentUser?.role === 'PELULUS' || currentUser?.role === 'ADMIN') && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <XCircle className="text-red-500" />
            ANALISIS PENOLAKAN
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(dashboardData.reasonStats).map(([reason, count]: any, idx) => (
              <div key={reason} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-red-200 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">ALASAN #{idx + 1}</span>
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-black">{count} KES</span>
                </div>
                <p className="font-bold text-slate-700 leading-snug">{reason}</p>
                <div className="mt-4 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '70%' }}
                    className="h-full bg-red-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Analysis Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Jadual Analisis Terperinci</h3>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black">{cachedData.length} REKOD</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-4">Syarikat</th>
                <th className="px-4 py-4">Gred</th>
                <th className="px-4 py-4">Jenis</th>
                <th className="px-4 py-4">Platform</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Kadar Sokongan</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {cachedData.slice(0, 10).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 font-bold text-slate-700">{item.syarikat}</td>
                  <td className="px-4 py-4"><span className="bg-slate-100 px-2 py-0.5 rounded font-black text-[10px]">{item.gred}</span></td>
                  <td className="px-4 py-4 text-xs font-bold text-blue-600">{item.jenis}</td>
                  <td className="px-4 py-4 text-xs font-medium text-slate-500">{item.db_konsultansi_platform || 'EMEL'}</td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                      (item.kelulusan || '').includes('LULUS') || (item.kelulusan || '').includes('SOKONG') ? "bg-green-100 text-green-700" :
                      (item.kelulusan || '').includes('TOLAK') ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {item.kelulusan || 'DALAM PROSES'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-black text-slate-400">100%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cachedData.length > 10 && (
            <div className="p-4 text-center border-t">
              <button 
                onClick={() => setActiveTab('senarai')}
                className="text-sm font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                Lihat Semua Rekod »
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = "text-blue-600" }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between hover:translate-y-[-4px] hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group">
    <div className="relative z-10">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
      <p className={cn("text-4xl font-black tracking-tighter", color)}>{value}</p>
    </div>
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-500">
      {icon}
    </div>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={cn("bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm h-[450px] relative overflow-hidden", className)}>
    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600/10" />
    <h3 className="font-black text-slate-800 text-lg mb-8 uppercase tracking-tight flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-blue-600" />
      {title}
    </h3>
    <div className="h-[300px]">
      {children}
    </div>
  </div>
);
