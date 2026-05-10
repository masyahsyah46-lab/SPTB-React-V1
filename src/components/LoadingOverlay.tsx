import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  submessage?: string;
  steps?: string[];
  currentStep?: number;
  progress?: number; // 0 to 100
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Memuatkan data...',
  submessage = 'Sistem Bersepadu SPTB (HQ)',
  steps = [],
  currentStep = 0,
  progress = 0
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50/98 backdrop-blur-3xl"
        >
          <div className="text-center w-full max-w-lg p-8">
            {/* Main Spinner */}
            <div className="relative w-24 h-24 mx-auto mb-10">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full shadow-[0_-2px_6px_rgba(37,99,235,0.4)]"
              ></motion.div>
            </div>

            <motion.h2 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-black mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-size-200 animate-shimmer bg-clip-text text-transparent"
            >
              {message}
            </motion.h2>
            
            <p className="text-slate-500 font-medium mb-10 uppercase tracking-widest text-xs">
              {submessage}
            </p>

            {/* Uiverse Loader Style */}
            <div className="relative w-full h-10 bg-slate-200 rounded-2xl overflow-hidden shadow-inner mb-4 flex items-center px-4">
              {/* Progress Background Shimmer */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-600 via-indigo-400 to-blue-600 bg-size-200 animate-shimmer shadow-lg shadow-blue-200"
              />
              
              {/* Overlay Text */}
              <div className="relative z-10 w-full flex justify-between items-center text-white font-black text-sm drop-shadow-md">
                <span className="truncate pr-4 italic">
                  {steps[currentStep] || message}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3].map((dot) => (
                <motion.span
                  key={dot}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: dot * 0.2 }}
                  className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm"
                ></motion.span>
              ))}
            </div>

            {/* Progress Markers */}
            <div className="flex justify-between mt-4 px-1 text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
