import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldAlert, ShieldCheck } from 'lucide-react';
import { LoadingOverlay } from '../components/LoadingOverlay';

const GOOGLE_CLIENT_ID = '758579492428-rnfev1nkkf2e6qduhujgtfbhudl2j9td.apps.googleusercontent.com';

export const Login: React.FC = () => {
  const { handleGoogleCredential, loading, error } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGoogle = () => {
      // @ts-ignore
      if (window.google?.accounts?.id && googleBtnRef.current) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // @ts-ignore
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_blue',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          width: '320',
        });
      } else {
        // Retry after delay if script or ref not ready
        setTimeout(initializeGoogle, 500);
      }
    };

    initializeGoogle();
  }, [handleGoogleCredential]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4">
      {/* Loading overlay for GIS/Backend processing */}
      <LoadingOverlay 
        isVisible={loading} 
        message="Mengesahkan Akaun..." 
        submessage="Proses Log Masuk Google"
        steps={['Mengesahkan token Google...', 'Menyemak pangkalan data...', 'Menyediakan profil...']}
        progress={65}
      />

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-lg border border-white/20 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck size={180} />
        </div>

        <div className="text-center mb-10 relative z-10">
          <div className="bg-blue-100 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3 hover:rotate-0 transition-transform duration-500">
            <LogIn size={48} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">
            Sistem Bersepadu <span className="text-blue-600">SPTB</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Versi 6.5.2 (React Migration)</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-2xl flex gap-4 animate-shake shadow-sm">
            <ShieldAlert className="text-red-500 flex-shrink-0" size={24} />
            <p className="text-sm text-red-700 font-bold leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex flex-col items-center space-y-8 relative z-10">
          <div className="text-center">
            <p className="text-slate-600 font-medium mb-6">Log masuk menggunakan akaun Google KUSKOP</p>
            <div 
              ref={googleBtnRef} 
              id="googleButton" 
              className="min-h-[50px] flex justify-center items-center shadow-lg rounded-full overflow-hidden hover:scale-[1.02] transition-transform" 
            />
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center relative z-10">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-loose max-w-[280px] mx-auto opacity-70">
            Hanya akaun dengan domain @kuskop.gov.my dibenarkan akses secara automatik demi keselamatan sistem.
          </p>
        </div>
      </div>
    </div>
  );
};
