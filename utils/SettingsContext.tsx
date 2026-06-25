import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimerSettings {
  workMinutes: number;
  workSeconds: number;
  restMinutes: number;
  restSeconds: number;
  rounds: number;
}

export interface TimerPreset extends TimerSettings {
  name?: string;
}

export const PRESET_SLOTS = 3;

interface SettingsContextType {
  settings: TimerSettings;
  updateSettings: (newSettings: TimerSettings) => Promise<void>;
  loadSettings: () => Promise<void>;
  presets: (TimerPreset | null)[];
  savePreset: (index: number, preset: TimerPreset) => Promise<void>;
}

const defaultSettings: TimerSettings = {
  workMinutes: 0,
  workSeconds: 30,
  restMinutes: 0,
  restSeconds: 10,
  rounds: 4,
};

const PRESETS_KEY = 'timerPresets';

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
  const [presets, setPresets] = useState<(TimerPreset | null)[]>(
    new Array(PRESET_SLOTS).fill(null)
  );

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

  // プリセットを読み込み
  const loadPresets = async () => {
    try {
      const savedPresets = await AsyncStorage.getItem(PRESETS_KEY);
      if (savedPresets) {
        const parsed: (TimerPreset | null)[] = JSON.parse(savedPresets);
        const padded = new Array(PRESET_SLOTS).fill(null).map((_, i) => parsed[i] ?? null);
        setPresets(padded);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  // 指定スロットにプリセットを保存
  const savePreset = async (index: number, preset: TimerPreset) => {
    try {
      const updated = [...presets];
      updated[index] = preset;
      await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
      setPresets(updated);
    } catch (error) {
      console.error('Failed to save preset:', error);
      throw error;
    }
  };

  // 初期化時に設定とプリセットを読み込み
  useEffect(() => {
    loadSettings();
    loadPresets();
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, loadSettings, presets, savePreset }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
