import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function App() {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState('work'); // 'work' or 'rest'
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(4); // 後でSettings画面で変更可能にする
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  // タイマーロジック
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      // フェーズ切り替え
      if (phase === 'work') {
        setPhase('rest');
        setTimeRemaining(10); // 10秒休憩
      } else {
        // rest終了
        if (currentRound >= totalRounds) {
          // 全ラウンド終了
          setIsRunning(false);
          setIsPaused(false);
          setPhase('work');
          setCurrentRound(1);
          setTimeRemaining(30);
        } else {
          // 次のラウンド
          setCurrentRound(prev => prev + 1);
          setPhase('work');
          setTimeRemaining(30); // 30秒作業
        }
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeRemaining, phase, currentRound, totalRounds]);

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
  };

  const handlePause = () => {
    if (isPaused) {
      setIsPaused(false); // Resume
    } else {
      setIsPaused(true); // Pause
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setPhase('work');
    setCurrentRound(1);
    setTimeRemaining(30);
  };

  const handleSettings = () => {
    // 後でSettings画面に遷移
    alert('Settings screen coming soon!');
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
          {phase === 'work' ? 'WORK' : phase === 'rest' ? 'REST' : 'READY'}
        </Text>
      </View>

      {/* Round Display */}
      <Text style={styles.roundText}>
        Round {currentRound} / {totalRounds}
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
    backgroundColor: '#F2F2F2', // Light gray background
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
    backgroundColor: '#34C759', // Green
  },
  settingsButton: {
    backgroundColor: '#000000', // Black
  },
  alarmButton: {
    backgroundColor: '#8E44AD', // Purple
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
