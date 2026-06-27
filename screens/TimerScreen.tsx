import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../App';
import { useSettings } from '../utils/SettingsContext';
import {
  initializeAudio,
  playBeepDouble,
  playBeepLong,
  vibrateDouble,
  vibrateLong,
  startBackgroundKeepAlive,
  stopBackgroundKeepAlive,
} from '../utils/AudioPlayer';
import { Colors } from '../utils/colors';

type TimerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Timer'>;

type Phase = 'work' | 'rest';

export default function TimerScreen() {
  const navigation = useNavigation<TimerScreenNavigationProp>();
  const { settings, presets, updateSettings } = useSettings();

  const [timeRemaining, setTimeRemaining] = useState(0); // 表示用（秒）
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<Phase>('work');
  const [currentRound, setCurrentRound] = useState(1);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // タイマーは「現在フェーズの終了時刻」を基準に進める。
  // 画面ロックや一時的なJS停止があっても、実時間から正しい状態を再計算できる。
  const phaseEndAtRef = useRef(0); // 現在フェーズの終了時刻 (ms epoch)
  const pausedRemainingMsRef = useRef(0); // 一時停止時の残りms
  const phaseRef = useRef<Phase>('work');
  const roundRef = useRef(1);
  const alarmRef = useRef(true);
  const vibrationRef = useRef(true);

  alarmRef.current = alarmEnabled;
  vibrationRef.current = vibrationEnabled;

  const workMs = (settings.workMinutes * 60 + settings.workSeconds) * 1000;
  const restMs = (settings.restMinutes * 60 + settings.restSeconds) * 1000;

  // 音声システム初期化
  useEffect(() => {
    initializeAudio();
  }, []);

  const applyIdleState = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setPhase('work');
    setCurrentRound(1);
    phaseRef.current = 'work';
    roundRef.current = 1;
    setTimeRemaining(Math.round(workMs / 1000));
    stopBackgroundKeepAlive();
  }, [workMs]);

  // 設定変更時にタイマーをリセット
  useEffect(() => {
    applyIdleState();
  }, [applyIdleState]);

  // 毎ティック実時間から残りを再計算し、終了時刻を過ぎていたらフェーズを進める。
  // 長時間止まっていた場合も while で複数フェーズ分を一気に追いつく。
  const tick = useCallback(() => {
    const now = Date.now();
    let endAt = phaseEndAtRef.current;
    let ph = phaseRef.current;
    let rd = roundRef.current;
    let transitioned = false;
    let finished = false;

    while (now >= endAt) {
      if (ph === 'work') {
        ph = 'rest';
        endAt += restMs;
        transitioned = true;
      } else if (rd >= settings.rounds) {
        finished = true;
        break;
      } else {
        rd += 1;
        ph = 'work';
        endAt += workMs;
        transitioned = true;
      }
    }

    if (finished) {
      if (alarmRef.current) playBeepLong();
      if (vibrationRef.current) vibrateLong();
      applyIdleState();
      return;
    }

    if (transitioned) {
      if (alarmRef.current) playBeepDouble();
      if (vibrationRef.current) vibrateDouble();
      phaseEndAtRef.current = endAt;
      phaseRef.current = ph;
      roundRef.current = rd;
      setPhase(ph);
      setCurrentRound(rd);
    }

    setTimeRemaining(Math.ceil((endAt - now) / 1000));
  }, [workMs, restMs, settings.rounds, applyIdleState]);

  useEffect(() => {
    if (!isRunning || isPaused) return;
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isRunning, isPaused, tick]);

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ボタンハンドラー
  const handleStart = () => {
    phaseEndAtRef.current = Date.now() + workMs;
    phaseRef.current = 'work';
    roundRef.current = 1;
    setPhase('work');
    setCurrentRound(1);
    setTimeRemaining(Math.round(workMs / 1000));
    setIsRunning(true);
    setIsPaused(false);
    startBackgroundKeepAlive();
  };

  const handlePause = () => {
    if (isPaused) {
      // Resume
      phaseEndAtRef.current = Date.now() + pausedRemainingMsRef.current;
      setIsPaused(false);
      startBackgroundKeepAlive();
    } else {
      // Pause
      pausedRemainingMsRef.current = Math.max(0, phaseEndAtRef.current - Date.now());
      setIsPaused(true);
      stopBackgroundKeepAlive();
    }
  };

  const handleReset = () => {
    applyIdleState();
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleSelectPreset = (index: number) => {
    const preset = presets[index];
    if (!preset || isRunning) return;
    updateSettings(preset);
  };

  const toggleAlarm = () => {
    setAlarmEnabled(!alarmEnabled);
  };

  const toggleVibration = () => {
    setVibrationEnabled(!vibrationEnabled);
  };

  // タイマーの色を取得
  const getTimerColor = () => {
    if (phase === 'work') return Colors.workBlue;
    if (phase === 'rest') return Colors.restRed;
    return Colors.textBlack;
  };

  const getStartPauseButtonText = () => {
    if (!isRunning) return 'Start';
    if (isPaused) return 'Resume';
    return 'Pause';
  };

  const getStartPauseButtonColor = () => {
    if (!isRunning || isPaused) return Colors.workBlue; // Start / Resume
    return Colors.pauseOrange; // Pause
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>RhythMark</Text>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={[styles.timer, { color: getTimerColor() }]}>
          {formatTime(timeRemaining)}
        </Text>
        <Text style={[styles.phase, { color: getTimerColor() }]}>
          {phase === 'work' ? 'WORK' : 'REST'}
        </Text>
      </View>

      {/* Round Display */}
      <Text style={styles.roundText}>
        Round {currentRound} / {settings.rounds}
      </Text>

      {/* Preset Quick Switch */}
      <View style={styles.presetQuickRow}>
        {presets.map((preset, index) => {
          const isActive =
            !!preset &&
            preset.workMinutes === settings.workMinutes &&
            preset.workSeconds === settings.workSeconds &&
            preset.restMinutes === settings.restMinutes &&
            preset.restSeconds === settings.restSeconds &&
            preset.rounds === settings.rounds;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.presetQuickButton,
                { backgroundColor: isActive ? Colors.primaryBlue : Colors.inactiveGray },
              ]}
              disabled={!preset || isRunning}
              onPress={() => handleSelectPreset(index)}
            >
              <Text style={styles.presetQuickButtonText}>
                {preset?.name?.trim() || `Preset ${index + 1}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Controls */}
      <View style={styles.mainControls}>
        {/* Start/Pause Button */}
        <TouchableOpacity
          style={[styles.button, styles.mainButton, { backgroundColor: getStartPauseButtonColor() }]}
          onPress={!isRunning ? handleStart : handlePause}
        >
          <Text style={styles.buttonText}>{getStartPauseButtonText()}</Text>
        </TouchableOpacity>

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.button, styles.mainButton, styles.resetButton]}
          onPress={handleReset}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        {/* Settings Button */}
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, styles.settingsButton]}
          onPress={handleSettings}
        >
          <Text style={[styles.buttonText, styles.settingsButtonText]}>Settings</Text>
        </TouchableOpacity>

        {/* Alarm Toggle */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            { backgroundColor: alarmEnabled ? Colors.primaryBlue : Colors.inactiveGray },
          ]}
          onPress={toggleAlarm}
        >
          <Text style={styles.buttonText}>
            {alarmEnabled ? '🔔 ON' : '🔕 OFF'}
          </Text>
        </TouchableOpacity>

        {/* Vibration Toggle */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            { backgroundColor: vibrationEnabled ? Colors.primaryBlue : Colors.inactiveGray },
          ]}
          onPress={toggleVibration}
        >
          <Text style={styles.buttonText}>
            {vibrationEnabled ? '📳 ON' : '📴 OFF'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: Colors.textBlack,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'System',
  },
  phase: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
  },
  roundText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textBlack,
    marginBottom: 15,
  },
  presetQuickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 30,
  },
  presetQuickButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  presetQuickButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  mainButton: {
    flex: 0.48,
  },
  secondaryButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  resetButton: {
    backgroundColor: Colors.successGreen,
  },
  settingsButton: {
    backgroundColor: Colors.black,
  },
  settingsButtonText: {
    fontSize: 13,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
