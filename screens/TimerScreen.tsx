import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../App';
import { useSettings } from '../utils/SettingsContext';
import { playBeepShort, playBeepLong, initializeAudio } from '../utils/AudioPlayer';
import { startTimerBackground, stopTimerBackground, recordBackgroundStart, getBackgroundElapsedTime } from '../utils/BackgroundManager';

type TimerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Timer'>;

export default function TimerScreen() {
  const navigation = useNavigation<TimerScreenNavigationProp>();
  const { settings } = useSettings();
  
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [currentRound, setCurrentRound] = useState(1);
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  // 音声システム初期化
  useEffect(() => {
    initializeAudio();
  }, []);

  // 設定変更時にタイマーをリセット
  useEffect(() => {
    const workTime = settings.workMinutes * 60 + settings.workSeconds;
    setTimeRemaining(workTime);
    setPhase('work');
    setCurrentRound(1);
    setIsRunning(false);
    setIsPaused(false);
  }, [settings]);

  // アプリ状態監視
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isRunning && !isPaused) {
        recordBackgroundStart();
        console.log('App went to background during timer');
      } else if (nextAppState === 'active') {
        if (isRunning && !isPaused) {
          syncTimerAfterBackground();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isRunning, isPaused]);

  // バックグラウンド復帰時のタイマー同期
  const syncTimerAfterBackground = () => {
    const elapsedSeconds = getBackgroundElapsedTime();
    if (elapsedSeconds <= 0) return;

    console.log(`Syncing timer after ${elapsedSeconds} seconds in background`);
    
    let remainingTime = timeRemaining - elapsedSeconds;
    let currentPhaseLocal = phase;
    let currentRoundLocal = currentRound;

    // バックグラウンド中のフェーズ変化を計算
    while (remainingTime <= 0 && isRunning) {
      if (currentPhaseLocal === 'work') {
        // Work完了
        if (alarmEnabled) playBeepShort();
        
        const restTime = settings.restMinutes * 60 + settings.restSeconds;
        currentPhaseLocal = 'rest';
        remainingTime += restTime;
      } else {
        // Rest完了
        if (currentRoundLocal >= settings.rounds) {
          // 全ラウンド完了
          if (alarmEnabled) playBeepLong();
          
          setIsRunning(false);
          setIsPaused(false);
          setPhase('work');
          setCurrentRound(1);
          const workTime = settings.workMinutes * 60 + settings.workSeconds;
          setTimeRemaining(workTime);
          stopTimerBackground();
          return;
        } else {
          // 次のラウンド
          if (alarmEnabled) playBeepShort();
          
          currentRoundLocal += 1;
          currentPhaseLocal = 'work';
          const workTime = settings.workMinutes * 60 + settings.workSeconds;
          remainingTime += workTime;
        }
      }
    }

    // 状態を更新
    setTimeRemaining(Math.max(0, remainingTime));
    setPhase(currentPhaseLocal);
    setCurrentRound(currentRoundLocal);
  };

  // タイマーロジック
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      // フェーズ切り替え
      handlePhaseComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeRemaining, phase, currentRound, settings]);

  // フェーズ完了時の処理
  const handlePhaseComplete = async () => {
    if (phase === 'work') {
      // Work → Rest
      if (alarmEnabled) {
        await playBeepShort();
      }
      const restTime = settings.restMinutes * 60 + settings.restSeconds;
      setPhase('rest');
      setTimeRemaining(restTime);
    } else {
      // Rest → 次のラウンドまたは終了
      if (currentRound >= settings.rounds) {
        // 全ラウンド終了
        if (alarmEnabled) {
          await playBeepLong();
        }
        setIsRunning(false);
        setIsPaused(false);
        setPhase('work');
        setCurrentRound(1);
        const workTime = settings.workMinutes * 60 + settings.workSeconds;
        setTimeRemaining(workTime);
        stopTimerBackground();
      } else {
        // 次のラウンド
        if (alarmEnabled) {
          await playBeepShort();
        }
        setCurrentRound(prev => prev + 1);
        setPhase('work');
        const workTime = settings.workMinutes * 60 + settings.workSeconds;
        setTimeRemaining(workTime);
      }
    }
  };

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ボタンハンドラー
  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    startTimerBackground();
  };

  const handlePause = () => {
    if (isPaused) {
      setIsPaused(false); // Resume
      startTimerBackground();
    } else {
      setIsPaused(true); // Pause
      stopTimerBackground();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setPhase('work');
    setCurrentRound(1);
    const workTime = settings.workMinutes * 60 + settings.workSeconds;
    setTimeRemaining(workTime);
    stopTimerBackground();
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const toggleAlarm = () => {
    setAlarmEnabled(!alarmEnabled);
  };

  // タイマーの色を取得
  const getTimerColor = () => {
    if (phase === 'work') return '#007AFF'; // Blue
    if (phase === 'rest') return '#FF3B30'; // Red
    return '#000000';
  };

  const getStartPauseButtonText = () => {
    if (!isRunning) return 'Start';
    if (isPaused) return 'Resume';
    return 'Pause';
  };

  const getStartPauseButtonColor = () => {
    if (!isRunning) return '#007AFF'; // Blue
    return '#FF9500'; // Orange for pause/resume
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
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>

        {/* Alarm Toggle */}
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, styles.alarmButton]}
          onPress={toggleAlarm}
        >
          <Text style={styles.buttonText}>
            {alarmEnabled ? '🔔 ON' : '🔕 OFF'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#000',
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
    color: '#000000',
    marginBottom: 30,
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
    flex: 0.48,
  },
  resetButton: {
    backgroundColor: '#34C759',
  },
  settingsButton: {
    backgroundColor: '#000000',
  },
  alarmButton: {
    backgroundColor: '#8E44AD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
