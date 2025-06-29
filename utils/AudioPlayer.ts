import { Audio } from 'expo-av';

export type AudioType = 'beep_short' | 'beep_long' | 'beep_double';

class AudioPlayer {
  private initialized = false;

  // 音声システム初期化（シンプル版）
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 基本的なオーディオモード設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      this.initialized = true;
      console.log('AudioPlayer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioPlayer:', error);
    }
  }

  // 音声再生
  async playSound(type: AudioType, alarmEnabled: boolean = true): Promise<void> {
    try {
      // 初期化を確認
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`Playing ${type}, alarmEnabled: ${alarmEnabled}`);

      // 音声（アラームONの場合のみ）
      if (alarmEnabled) {
        if (type === 'beep_double') {
          // ピッピッ音（短いビープを2回再生）
          await this.playDoubleBeep();
        } else {
          // Web音声合成を使用（ファイル読み込み問題を回避）
          await this.playWebBeep(type);
        }

        console.log(`Audio played: ${type}`);
      }
    } catch (error) {
      console.error(`Failed to play sound ${type}:`, error);
    }
  }

  // Web音声合成でビープ音を生成
  private async playWebBeep(type: AudioType): Promise<void> {
    try {
      // iOSで動作するようにAudioContextを再利用
      if (!this.webAudioContext) {
        this.webAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const context = this.webAudioContext;
      
      // iOSでAudioContextが停止している場合は再開
      if (context.state === 'suspended') {
        await context.resume();
        console.log('AudioContext resumed');
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // 周波数とデュレーション設定（より聞こえやすい周波数と波形）
      oscillator.frequency.setValueAtTime(1000, context.currentTime);
      oscillator.type = 'square'; // より鋭い音
      
      const duration = type === 'beep_long' ? 1.0 : 0.3;
      
      // エンベロープ設定（最大音量）
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(1.0, context.currentTime + 0.01); // 最大音量
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + duration);

      console.log(`Web beep generated: ${type}, AudioContext state: ${context.state}`);
    } catch (error) {
      console.error('Failed to generate web beep:', error);
    }
  }

  // ダブルビープ音を再生（ピッピッ）
  private async playDoubleBeep(): Promise<void> {
    try {
      console.log('Starting double beep');
      
      // 直接Web Audio APIで2つのビープを作成
      if (!this.webAudioContext) {
        this.webAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const context = this.webAudioContext;
      
      if (context.state === 'suspended') {
        await context.resume();
      }

      // 1回目のビープ
      const osc1 = context.createOscillator();
      const gain1 = context.createGain();
      osc1.connect(gain1);
      gain1.connect(context.destination);
      osc1.frequency.setValueAtTime(1000, context.currentTime);
      osc1.type = 'square';
      gain1.gain.setValueAtTime(0, context.currentTime);
      gain1.gain.linearRampToValueAtTime(1.0, context.currentTime + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      osc1.start(context.currentTime);
      osc1.stop(context.currentTime + 0.3);
      
      console.log('First beep started');

      // 2回目のビープ（150ms後）
      const startTime2 = context.currentTime + 0.35;
      const osc2 = context.createOscillator();
      const gain2 = context.createGain();
      osc2.connect(gain2);
      gain2.connect(context.destination);
      osc2.frequency.setValueAtTime(1000, startTime2);
      osc2.type = 'square';
      gain2.gain.setValueAtTime(0, startTime2);
      gain2.gain.linearRampToValueAtTime(1.0, startTime2 + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.01, startTime2 + 0.3);
      osc2.start(startTime2);
      osc2.stop(startTime2 + 0.3);

      console.log('Second beep scheduled');
      console.log('Double beep completed');
    } catch (error) {
      console.error('Failed to play double beep:', error);
    }
  }
}

// シングルトンインスタンス
const audioPlayer = new AudioPlayer();

// 便利関数
export const initializeAudio = () => audioPlayer.initialize();

// iOS用: ユーザーインタラクションでAudioContextを初期化
export const enableWebAudio = async () => {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (context.state === 'suspended') {
      await context.resume();
    }
    // 無音を再生してiOSでのAudioContextを有効化
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    gainNode.gain.setValueAtTime(0, context.currentTime);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.01);
    console.log('Web Audio enabled for iOS');
  } catch (error) {
    console.error('Failed to enable web audio:', error);
  }
};

// タイマー移行時の音声（ピッピッ音）
export const playBeepDouble = (alarmEnabled: boolean = true) => 
  audioPlayer.playSound('beep_double', alarmEnabled);

// 従来の短いビープ音（必要に応じて残す）
export const playBeepShort = (alarmEnabled: boolean = true) => 
  audioPlayer.playSound('beep_short', alarmEnabled);

// 長いビープ音（終了時用 - そのまま）
export const playBeepLong = (alarmEnabled: boolean = true) => 
  audioPlayer.playSound('beep_long', alarmEnabled);

export default audioPlayer;
