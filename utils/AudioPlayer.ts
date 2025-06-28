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
          // 従来の単発音声
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
        }

        console.log(`Audio played: ${type}`);
      }
    } catch (error) {
      console.error(`Failed to play sound ${type}:`, error);
    }
  }

  // ダブルビープ音を再生（ピッピッ）
  private async playDoubleBeep(): Promise<void> {
    try {
      const audioFile = require('../assets/audio/beep_short.wav');
      
      // 1回目のビープ
      const { sound: sound1 } = await Audio.Sound.createAsync(audioFile, {
        shouldPlay: true,
        volume: 1.0,
      });

      // 1回目の再生完了を待つ
      return new Promise((resolve) => {
        sound1.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            await sound1.unloadAsync();
            
            // 少し間隔を空けて2回目のビープ
            setTimeout(async () => {
              try {
                const { sound: sound2 } = await Audio.Sound.createAsync(audioFile, {
                  shouldPlay: true,
                  volume: 1.0,
                });

                sound2.setOnPlaybackStatusUpdate(async (status2) => {
                  if (status2.isLoaded && status2.didJustFinish) {
                    await sound2.unloadAsync();
                    resolve();
                  }
                });
              } catch (error) {
                console.error('Failed to play second beep:', error);
                resolve();
              }
            }, 150); // 150ms間隔でピッピッ音
          }
        });
      });
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
