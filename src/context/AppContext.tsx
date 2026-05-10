import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from './AuthContext';

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cachedData: any[];
  dashboardData: any;
  selectedRecord: any | null;
  setSelectedRecord: (record: any | null) => void;
  setCachedData: (data: any[]) => void;
  refreshData: () => Promise<void>;
  sfxVolume: number;
  setSfxVolume: (vol: number) => void;
  playSoundEffect: (soundFile: string) => void;
  autoSaveForm: (data: any) => void;
  loadPersistedForm: () => any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [cachedData, setCachedState] = useState<any[]>(() => {
    const stored = localStorage.getItem('stb_data_cache');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [dashboardData, setDashboardData] = useState<any>({
    total: 0,
    lulus: 0,
    tolak: 0,
    proses: 0,
    typeStats: {},
    reasonStats: {},
  });

  const [sfxVolume, setSfxVolumeState] = useState<number>(() => {
    const stored = localStorage.getItem('stb_sfx_volume');
    return stored ? parseFloat(stored) : 0.7;
  });

  const setCachedData = useCallback((data: any[]) => {
    setCachedState(data);
    localStorage.setItem('stb_data_cache', JSON.stringify(data));
    localStorage.setItem('stb_cache_timestamp', Date.now().toString());
  }, []);

  const setSfxVolume = useCallback((vol: number) => {
    setSfxVolumeState(vol);
    localStorage.setItem('stb_sfx_volume', vol.toString());
  }, []);

  const playSoundEffect = useCallback((soundFile: string) => {
    try {
      let fileName = soundFile;
      if (fileName === 'ui_click.mp3') fileName = '/audio/ui click.mp3';
      else if (fileName === 'positive_chime.mp3') fileName = '/audio/positive chime.mp3';
      else if (fileName === 'error_buzz.mp3') fileName = '/audio/error buzz.mp3';
      
      const sfx = new Audio(fileName);
      sfx.volume = sfxVolume;
      sfx.play().catch(e => console.warn("Audio play blocked:", e));
    } catch (error) {
      console.error("Failed to play sound effect:", error);
    }
  }, [sfxVolume]);

  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const result = await apiService.getData(currentUser.role, currentUser.name);
      setCachedData(result);
      
      // Update Dashboard Data locally
      const total = result.length;
      const lulus = result.filter((d: any) => d.kelulusan?.includes('LULUS')).length;
      const tolak = result.filter((d: any) => d.kelulusan?.includes('TOLAK') || d.kelulusan?.includes('SIASAT')).length;
      const proses = total - (lulus + tolak);
      
      const typeStats: any = {};
      const reasonStats: any = {};
      
      result.forEach((item: any) => {
        const type = item.jenis?.toUpperCase() || 'LAIN-LAIN';
        typeStats[type] = (typeStats[type] || 0) + 1;
        
        if (item.kelulusan?.includes('TOLAK') || item.kelulusan?.includes('SIASAT')) {
          const reason = item.alasan || 'Tiada Alasan';
          reasonStats[reason] = (reasonStats[reason] || 0) + 1;
        }
      });

      setDashboardData({ total, lulus, tolak, proses, typeStats, reasonStats });
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [currentUser, setCachedData]);

  const autoSaveForm = useCallback((data: any) => {
    if (!currentUser) return;
    const persistenceData = {
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      role: currentUser.role,
      fields: data
    };
    localStorage.setItem('stb_form_persistence', JSON.stringify(persistenceData));
  }, [currentUser]);

  const loadPersistedForm = useCallback(() => {
    const stored = localStorage.getItem('stb_form_persistence');
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  return (
    <AppContext.Provider 
      value={{ 
        activeTab,
        setActiveTab,
        cachedData, 
        dashboardData,
        selectedRecord,
        setSelectedRecord,
        setCachedData, 
        refreshData, 
        sfxVolume,
        setSfxVolume,
        playSoundEffect,
        autoSaveForm,
        loadPersistedForm
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
