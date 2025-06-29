import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  AppState, 
  AppStateStatus 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { playBeepDouble, playBeepLong, initializeAudio, enableWebAudio } from '../utils/AudioPlayer';

export interface TimerSettings {
  workTime: number;
  restTime: number;
  rounds: number;
  alarmEnabled: boolean;
}

interface TimerScreenProps {
  settings: TimerSettings;
  onBack: () => void;
}

type TimerState = 'work' | 'rest' | 'paused' | 'completed';

const TimerScreen: React.FC<TimerScreenProps> = ({ settings, onBack }) => {
  const [timeLeft, setTimeLeft] = useState(settings.workTime * 60);
  const [timerState, setTimerState] = useState<TimerState>('paused');
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimeRef = useRef<number>(0);

  // 音声システム初期化
  useEffect(() => {
    initializeAudio();
  }, []);

  // Keep Awake管理
  useEffect(() => {
    if (timerState === 'work' || timerState === 'rest') {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }

    return () => {
      deactivateKeepAwake();
    };
  }, [timerState]);

  // バックグラウンド対応
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && (timerState === 'work' || timerState === 'rest')) {
        backgroundTimeRef.current = Date.now();
      } else if (nextAppState === 'active' && backgroundTimeRef.current > 0) {
        const backgroundDuration = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
        
        if (backgroundDuration > 0 && (timerState === 'work' || timerState === 'rest')) {
          setTimeLeft(prevTime => {
            const newTime = Math.max(0, prevTime - backgroundDuration);
            if (newTime === 0) {
              handlePhaseComplete();
            }
            return newTime;
          });
        }
        
        backgroundTimeRef.current = 0;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [timerState]);

  // タイマーメイン処理
  useEffect(() => {
    if (timerState === 'work' || timerState === 'rest') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          console.log(`⏱️ Timer tick: ${newTime}, phase: ${isWorkPhase ? 'work' : 'rest'}, state: ${timerState}`);
          if (newTime <= 0) {
            console.log(`⏱️ Time reached 0, calling handlePhaseComplete`);
            handlePhaseComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState]);

// フェーズ完了処理
const handlePhaseComplete = () => {
  console.log('🔊 handlePhaseComplete called, isWorkPhase:', isWorkPhase, 'currentRound:', currentRound);
  
  if (isWorkPhase) {
    console.log('🔊 Work->Rest: transitioning to rest phase');
    
    // 状態変更を最優先で実行
    setIsWorkPhase(false);
    setTimeLeft(settings.restTime * 60);
    setTimerState('rest');
    
    // 音声再生は非同期で実行（状態変更に影響しない）
    setTimeout(() => {
      console.log('🔊 Playing transition beep - should be double');
      playBeepShort(settings.alarmEnabled);
      setTimeout(() => {
        playBeepShort(settings.alarmEnabled);
      }, 200);
    }, 10);
    
    console.log('🔊 State changed to rest');
  } else {
    if (currentRound >= settings.rounds) {
      console.log('🔊 All rounds complete');
      
      setTimerState('completed');
      deactivateKeepAwake();
      
      // 音声再生は非同期で実行
      setTimeout(() => {
        playBeepLong(settings.alarmEnabled).catch(error => {
          console.error('🔊 playBeepLong failed:', error);
        });
      }, 10);
    } else {
      console.log('🔊 Rest->Work: transitioning to next work phase');
      
      // 状態変更を最優先で実行
      setCurrentRound(prev => prev + 1);
      setIsWorkPhase(true);
      setTimeLeft(settings.workTime * 60);
      setTimerState('work');
      
      // 音声再生は非同期で実行
      setTimeout(() => {
        console.log('🔊 Playing transition beep - should be double');
        playBeepShort(settings.alarmEnabled);
        setTimeout(() => {
          playBeepShort(settings.alarmEnabled);
        }, 200);
      }, 10);
      
      console.log('🔊 State changed to work');
    }
  }
};
 
  // 開始/一時停止
  const handleStartPause = async () => {
    if (timerState === 'paused') {
      // iOS Safari用: ユーザーインタラクションでAudio Contextを有効化
      await enableWebAudio();
      setTimerState(isWorkPhase ? 'work' : 'rest');
    } else {
      setTimerState('paused');
    }
  };

  // リセット
  const handleReset = () => {
    setTimerState('paused');
    setIsWorkPhase(true);
    setCurrentRound(1);
    setTimeLeft(settings.workTime * 60);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // スキップ
  const handleSkip = () => {
    if (timerState !== 'completed') {
      handlePhaseComplete();
    }
  };

  // 次のラウンド
  const handleNextRound = () => {
    if (currentRound < settings.rounds) {
      setCurrentRound(prev => prev + 1);
      setIsWorkPhase(true);
      setTimeLeft(settings.workTime * 60);
      setTimerState('paused');
    }
  };

  // 前のラウンド
  const handlePrevRound = () => {
    if (currentRound > 1) {
      setCurrentRound(prev => prev - 1);
      setIsWorkPhase(true);
      setTimeLeft(settings.workTime * 60);
      setTimerState('paused');
    }
  };

  // 時間フォーマット
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 進捗計算
  const getProgress = (): number => {
    const totalTime = isWorkPhase ? settings.workTime * 60 : settings.restTime * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // 状態に応じた色設定
  const getColors = () => {
    if (timerState === 'completed') {
      return {
        gradient: ['#10B981', '#059669'],
        text: '#10B981',
        button: '#10B981'
      };
    }
    
    if (isWorkPhase) {
      return {
        gradient: ['#EF4444', '#DC2626'],
        text: '#EF4444',
        button: '#EF4444'
      };
    } else {
      return {
        gradient: ['#3B82F6', '#2563EB'],
        text: '#3B82F6',
        button: '#3B82F6'
      };
    }
  };

  const colors = getColors();

  return (
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RhythMark</Text>
        <View style={styles.headerRight} />
      </View>

      {/* ラウンド表示 */}
      <View style={styles.roundSection}>
        <Text style={styles.roundText}>
          Round {currentRound} / {settings.rounds}
        </Text>
        <Text style={[styles.phaseText, { color: colors.text }]}>
          {timerState === 'completed' ? 'COMPLETED!' : 
           isWorkPhase ? 'WORK TIME' : 'REST TIME'}
        </Text>
      </View>

      {/* プログレスバー */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={colors.gradient}
            style={[styles.progressFill, { width: `${getProgress()}%` }]}
          />
        </View>
      </View>

      {/* タイマー表示 */}
      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: colors.text }]}>
          {formatTime(timeLeft)}
        </Text>
      </View>

      {/* 設定情報 */}
      <View style={styles.settingsInfo}>
        <Text style={styles.settingText}>
          Work: {settings.workTime}min | Rest: {settings.restTime}min
        </Text>
        <Text style={styles.settingText}>
          🔊 {settings.alarmEnabled ? 'ON' : 'OFF'}
        </Text>
      </View>

      {/* コントロールボタン */}
      <View style={styles.controlsContainer}>
        {/* 上段: ラウンド操作 */}
        <View style={styles.roundControls}>
          <TouchableOpacity
            style={[styles.roundButton, { opacity: currentRound <= 1 ? 0.3 : 1 }]}
            onPress={handlePrevRound}
            disabled={currentRound <= 1}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            <Text style={styles.roundButtonText}>Prev</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roundButton, { opacity: currentRound >= settings.rounds ? 0.3 : 1 }]}
            onPress={handleNextRound}
            disabled={currentRound >= settings.rounds}
          >
            <Text style={styles.roundButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 下段: メイン操作 */}
        <View style={styles.mainControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.button }]}
            onPress={handleStartPause}
            disabled={timerState === 'completed'}
          >
            <Ionicons 
              name={timerState === 'paused' ? 'play' : 'pause'} 
              size={32} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSkip}
            disabled={timerState === 'completed'}
          >
            <Ionicons name="play-forward" size={24} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  roundSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  roundText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressContainer: {
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  settingsInfo: {
    alignItems: 'center',
    marginBottom: 50,
  },
  settingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  controlsContainer: {
    paddingHorizontal: 20,
  },
  roundControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  roundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  roundButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 80,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default TimerScreen;
