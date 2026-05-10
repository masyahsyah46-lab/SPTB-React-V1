import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

export type ModalType = 'success' | 'error' | 'warning' | 'info';

interface CustomModalProps {
  isOpen: boolean;
  onClose: (result: boolean) => void;
  title?: string;
  message: string;
  type?: ModalType;
  isConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  title = 'Makluman',
  message,
  type = 'info',
  isConfirm = false,
  confirmText = 'Teruskan',
  cancelText = 'Batal',
  isDanger = false,
}) => {
  const { playSoundEffect } = useAppContext();

  useEffect(() => {
    if (isOpen) {
      const sound = type === 'error' ? 'error_buzz.mp3' : 'minimal alert.mp3';
      playSoundEffect(sound);
    }
  }, [isOpen, type, playSoundEffect]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-green-500" size={48} />;
      case 'error': return <XCircle className="text-red-500" size={48} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={48} />;
      default: return <Info className="text-blue-500" size={48} />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success': return 'bg-green-100';
      case 'error': return 'bg-red-100';
      case 'warning': return 'bg-amber-100';
      default: return 'bg-blue-100';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10vh] px-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isConfirm && onClose(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white w-full max-w-md rounded-[2rem] p-8 text-center shadow-2xl border border-white/20"
          >
            <button
              onClick={() => onClose(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className={cn("mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6", getIconBg())}>
              {getIcon()}
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-3">{title}</h3>
            <div 
              className="text-slate-600 leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: message }}
            />

            <div className="flex gap-3 justify-center">
              {isConfirm && (
                <button
                  onClick={() => {
                    playSoundEffect('ui_click.mp3');
                    onClose(false);
                  }}
                  className="flex-1 px-6 py-3.5 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  playSoundEffect('ui_click.mp3');
                  onClose(true);
                }}
                className={cn(
                  "flex-1 px-6 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]",
                  isDanger ? "bg-red-600 shadow-red-200" : "bg-blue-600 shadow-blue-200"
                )}
              >
                {isConfirm ? confirmText : 'OK'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
