import { Audio } from 'expo-av';

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

  // 音声再生（シンプル版）
  async playSound(type: AudioType): Promise<void> {
    try {
      // 初期化を確認
      if (!this.initialized) {
        await this.initialize();
      }

      // 音声ファイルを直接読み込んで再生
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

      console.log(`Played ${type} successfully`);
    } catch (error) {
      console.error(`Failed to play ${type}:`, error);
    }
  }
}

// シングルトンインスタンス
export const audioPlayer = new AudioPlayer();

// 便利関数
export const playBeepShort = async (): Promise<void> => {
  await audioPlayer.playSound('beep_short');
};

export const playBeepLong = async (): Promise<void> => {
  await audioPlayer.playSound('beep_long');
};

export const initializeAudio = async (): Promise<void> => {
  await audioPlayer.initialize();
};
