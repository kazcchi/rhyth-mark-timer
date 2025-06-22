import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimerSettings {
  workMinutes: number;
  workSeconds: number;
  restMinutes: number;
  restSeconds: number;
  rounds: number;
}

interface SettingsContextType {
  settings: TimerSettings;
  updateSettings: (newSettings: TimerSettings) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const defaultSettings: TimerSettings = {
  workMinutes: 0,
  workSeconds: 30,
  restMinutes: 0,
  restSeconds: 10,
  rounds: 4,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);

  // 設定を読み込み
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('timerSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // 設定を保存・更新
  const updateSettings = async (newSettings: TimerSettings) => {
    try {
      await AsyncStorage.setItem('timerSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  // 初期化時に設定を読み込み
  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
