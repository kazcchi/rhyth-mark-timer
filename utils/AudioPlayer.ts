import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export type AudioType = 'beep_short' | 'beep_long';

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

  // 強いバイブレーション関数
  private async strongVibration(): Promise<void> {
    try {
      // 最強のバイブレーション
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // 少し間をあけて再度バイブレーション
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 100);
    } catch (error) {
      console.error('Strong vibration failed:', error);
    }
  }

  // 長いバイブレーション（完了時用）
  private async longVibration(): Promise<void> {
    try {
      // 3回連続の強いバイブレーション
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 150);
      
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 300);
    } catch (error) {
      console.error('Long vibration failed:', error);
    }
  }

  // 音声 + バイブレーション再生
  async playSound(type: AudioType, alarmEnabled: boolean = true): Promise<void> {
    try {
      // 初期化を確認
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`Playing ${type}, alarmEnabled: ${alarmEnabled}`);

      // バイブレーション（常に実行 - アラームON/OFF関係なし）
      if (type === 'beep_short') {
        await this.strongVibration();
        console.log('Strong vibration executed for beep_short');
      } else {
        await this.longVibration();
        console.log('Long vibration executed for beep_long');
      }

      // 音声（アラームONの場合のみ）
      if (alarmEnabled) {
        const audioFile = type === 'beep_short' 
          ? require('../assets/audio/beep_short.wav')
          : require('../assets/audio/beep_long.wav');

        const { sound } = await Audio.Sound.createAsync(audioFile, {
          shouldPlay: true,
          volume: 1.0,
        });

        // 再生完了後にアンロード
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });

        console.log(`Audio played: ${type}`);
      } else {
        console.log(`Vibration only mode: ${type}`);
      }
    } catch (error) {
      console.error(`Failed to play ${type}:`, error);
    }
  }

  // デバッグ用: バイブレーションのみテスト
  async testVibration(type: AudioType): Promise<void> {
    console.log(`Testing vibration: ${type}`);
    
    if (type === 'beep_short') {
      await this.strongVibration();
    } else {
      await this.longVibration();
    }
  }
}

// シングルトンインスタンス
export const audioPlayer = new AudioPlayer();

// 便利関数（バイブレーション対応）
export const playBeepShort = async (alarmEnabled: boolean = true): Promise<void> => {
  await audioPlayer.playSound('beep_short', alarmEnabled);
};

export const playBeepLong = async (alarmEnabled: boolean = true): Promise<void> => {
  await audioPlayer.playSound('beep_long', alarmEnabled);
};

export const initializeAudio = async (): Promise<void> => {
  await audioPlayer.initialize();
};

// デバッグ用エクスポート
export const testVibration = async (type: AudioType): Promise<void> => {
  await audioPlayer.testVibration(type);
};
