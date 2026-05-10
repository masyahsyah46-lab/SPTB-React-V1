import React from 'react';
import { cn } from '../lib/utils';

interface PrintLayoutProps {
  data: any;
  type: 'borang' | 'profile';
}

export const PrintLayouts: React.FC<PrintLayoutProps> = ({ data, type }) => {
  if (!data) return null;

  return (
    <div className="hidden print:block print:bg-white print:text-black print:min-h-screen">
      <style>
        {`
          @media print {
            @page { margin: 1.5cm; size: A4; }
            body { background: white !important; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
            .print-no-break { break-inside: avoid; }
            .print-table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
            .print-table th, .print-table td { border: 1px solid #e2e8f0; padding: 12px; font-size: 11px; vertical-align: top; }
            .print-table th { background-color: #f8fafc !important; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; }
            .header-box { border: 2px solid #000; padding: 2rem; margin-bottom: 2rem; text-align: center; }
            .field-label { font-weight: 800; font-size: 9px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; display: block; }
            .field-value { font-weight: 700; font-size: 12px; text-transform: uppercase; color: #0f172a; }
          }
        `}
      </style>

      {type === 'borang' && (
        <div id="printLayout" className="p-8 max-w-[21cm] mx-auto bg-white">
          <div className="header-box">
            <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">BORANG SEMAKAN SYARIKAT {data.jenis}</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Sistem Pendaftaran Taraf Bumiputera (HQ)</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="col-span-2 mb-4">
                <h2 className="text-xs font-black bg-black text-white px-4 py-2 inline-block uppercase tracking-widest">A. MAKLUMAT SYARIKAT</h2>
            </div>
            
            <div className="col-span-2 border-b pb-4">
                <span className="field-label">Nama Syarikat</span>
                <span className="text-2xl font-black">{data.nama_syarikat}</span>
            </div>

            <div className="border-b pb-4">
                <span className="field-label">No Pendaftaran (CIDB)</span>
                <span className="field-value">{data.no_rujukan_cidb}</span>
            </div>

            <div className="border-b pb-4">
                <span className="field-label">Gred</span>
                <span className="field-value">{data.gred}</span>
            </div>

            <div className="border-b pb-4">
                <span className="field-label">Kategori</span>
                <span className="field-value">{data.kategori}</span>
            </div>

            <div className="border-b pb-4">
                <span className="field-label">Daerah</span>
                <span className="field-value">{data.daerah}</span>
            </div>
            
            <div className="col-span-2 border-b pb-4">
                <span className="field-label">Alamat Perniagaan</span>
                <span className="field-value">{data.alamat_perniagaan || '-'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="col-span-2 mb-4">
                <h2 className="text-xs font-black bg-black text-white px-4 py-2 inline-block uppercase tracking-widest">B. KEPUTUSAN SEMAKAN</h2>
            </div>

            <div className="border-1 border-slate-200 p-6 rounded-lg col-span-1">
                <span className="field-label">Syor Lawatan Tapak</span>
                <span className="text-xl font-black">{data.syor_lawatan_tapak}</span>
            </div>

            <div className="border-1 border-slate-200 p-6 rounded-lg col-span-1">
                <span className="field-label">Kategori Lawatan</span>
                <span className="field-value">{data.kategori_lawatan || 'BIASA'}</span>
            </div>

            <div className="col-span-2 border-1 border-slate-200 p-6 rounded-lg mt-4 h-32">
                <span className="field-label">Ulasan Pengesyor</span>
                <p className="text-xs font-bold leading-relaxed">{data.ulasan_pengesyor || '-'}</p>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-10">
            <div className="text-center pt-8 border-t border-slate-200">
                <p className="text-[10px] font-black uppercase mb-16">Disediakan Oleh:</p>
                <p className="text-sm font-black uppercase">{data.nama_pengesyor}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">(PENOLONG PENGARAH)</p>
            </div>
            <div className="text-center pt-8 border-t border-slate-200">
                <p className="text-[10px] font-black uppercase mb-16">Keputusan Pelulus:</p>
                <div className="h-6 w-full border-b border-b-slate-200 mb-8" />
                <p className="text-sm font-black uppercase">{data.nama_pelulus || 'PENDING'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Print Layout (Simpler representation used for list view printing) */}
      {type === 'profile' && (
        <div id="printProfileLayout" className="p-8">
            {/* Same structure simplified */}
            <div className="header-box bg-slate-900 text-white border-none">
                <h1 className="text-2xl font-black uppercase">PROFILE SYARIKAT STB</h1>
                <p className="text-xs opacity-50 uppercase tracking-[0.3em]">Official Database Record</p>
            </div>
            <table className="print-table">
                <tbody>
                    <tr><th>Nama Syarikat</th><td>{data.nama_syarikat}</td></tr>
                    <tr><th>No CIDB</th><td>{data.no_rujukan_cidb}</td></tr>
                    <tr><th>Gred / Jenis</th><td>{data.gred} / {data.jenis}</td></tr>
                    <tr><th>Daerah</th><td>{data.daerah}</td></tr>
                    <tr><th>Status Kelulusan</th><td>{data.kelulusan || 'DRAFT'}</td></tr>
                    <tr><th>Tarikh Masuk</th><td>{data.tarikh_masuk}</td></tr>
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};
