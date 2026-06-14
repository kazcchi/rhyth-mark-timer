import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

// 音源アセット
const beepDoubleSource = require('../assets/audio/beep_double.wav'); // ピッピッ（フェーズ切替）
const beepLongSource = require('../assets/audio/beep_long.wav'); // ピー（全ラウンド終了）
const silenceSource = require('../assets/audio/silence.m4a'); // 無音60秒（バックグラウンド維持用）

let beepDoublePlayer: AudioPlayer | null = null;
let beepLongPlayer: AudioPlayer | null = null;
let silencePlayer: AudioPlayer | null = null;
let initialized = false;

// 音声システム初期化
// - playsInSilentMode: サイレントスイッチONでも鳴らす
// - mixWithOthers: Apple Music 等を止めずにビープを重ねる
// - shouldPlayInBackground: 画面ロック中もオーディオセッションを維持
export async function initializeAudio(): Promise<void> {
  if (initialized) return;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: true,
      allowsRecording: false,
    });

    beepDoublePlayer = createAudioPlayer(beepDoubleSource);
    beepDoublePlayer.volume = 0.5;
    beepLongPlayer = createAudioPlayer(beepLongSource);
    beepLongPlayer.volume = 0.5;
    silencePlayer = createAudioPlayer(silenceSource);
    silencePlayer.loop = true;

    initialized = true;
    console.log('AudioPlayer initialized');
  } catch (error) {
    console.error('Failed to initialize AudioPlayer:', error);
  }
}

async function playBeep(player: AudioPlayer | null): Promise<void> {
  try {
    if (!initialized) await initializeAudio();
    if (!player) return;
    await player.seekTo(0);
    player.play();
  } catch (error) {
    console.error('Failed to play beep:', error);
  }
}

// フェーズ切替時のピッピッ音
export const playBeepDouble = () => playBeep(beepDoublePlayer);

// 全ラウンド終了時のピー音
export const playBeepLong = () => playBeep(beepLongPlayer);

// タイマー作動中だけ無音をループ再生し、ロック中もアプリを生かしておく
export async function startBackgroundKeepAlive(): Promise<void> {
  try {
    if (!initialized) await initializeAudio();
    silencePlayer?.play();
    console.log('Background keep-alive started');
  } catch (error) {
    console.error('Failed to start keep-alive:', error);
  }
}

export async function stopBackgroundKeepAlive(): Promise<void> {
  try {
    silencePlayer?.pause();
    await silencePlayer?.seekTo(0);
    console.log('Background keep-alive stopped');
  } catch (error) {
    console.error('Failed to stop keep-alive:', error);
  }
}
