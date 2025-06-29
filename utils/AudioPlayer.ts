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
          this.playWebBeep(type);
        }

        console.log(`Audio played: ${type}`);
      }
    } catch (error) {
      console.error(`Failed to play sound ${type}:`, error);
    }
  }

  // Web音声合成でビープ音を生成
  private playWebBeep(type: AudioType): void {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // 周波数とデュレーション設定
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.type = 'sine';
      
      const duration = type === 'beep_long' ? 1.0 : 0.2;
      
      // エンベロープ設定
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + duration);

      console.log(`Web beep generated: ${type}`);
    } catch (error) {
      console.error('Failed to generate web beep:', error);
    }
  }

  // ダブルビープ音を再生（ピッピッ）
  private async playDoubleBeep(): Promise<void> {
    try {
      // 1回目のビープ
      this.playWebBeep('beep_short');
      
      // 150ms後に2回目のビープ
      setTimeout(() => {
        this.playWebBeep('beep_short');
      }, 150);
      
      console.log('Double beep generated');
    } catch (error) {
      console.error('Failed to play double beep:', error);
    }
  }
}

// シングルトンインスタンス
const audioPlayer = new AudioPlayer();

// 便利関数
export const initializeAudio = () => audioPlayer.initialize();

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
