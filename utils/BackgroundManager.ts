import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Platform } from 'react-native';

// バックグラウンドタスク名
const BACKGROUND_TIMER_TASK = 'BACKGROUND_TIMER_TASK';

class BackgroundManager {
  private isKeepAwakeActive = false;
  private backgroundStartTime: number | null = null;

  // 通知設定
  async initializeNotifications(): Promise<void> {
    try {
      // 通知ハンドラー設定
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // 通知権限リクエスト
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permission not granted');
      }

      // Android通知チャンネル作成
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('timer', {
          name: 'Timer Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      console.log('Notifications initialized');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  // Keep Awake開始
  async startKeepAwake(): Promise<void> {
    if (!this.isKeepAwakeActive) {
      try {
        await activateKeepAwakeAsync();
        this.isKeepAwakeActive = true;
        console.log('Keep awake activated');
      } catch (error) {
        console.error('Failed to activate keep awake:', error);
      }
    }
  }

  // Keep Awake停止
  async stopKeepAwake(): Promise<void> {
    if (this.isKeepAwakeActive) {
      try {
        await deactivateKeepAwake();
        this.isKeepAwakeActive = false;
        console.log('Keep awake deactivated');
      } catch (error) {
        console.error('Failed to deactivate keep awake:', error);
      }
    }
  }

  // バックグラウンド開始時の時間記録
  recordBackgroundStart(): void {
    this.backgroundStartTime = Date.now();
    console.log('Background start time recorded');
  }

  // バックグラウンドから復帰時の経過時間計算
  getBackgroundElapsedTime(): number {
    if (this.backgroundStartTime === null) {
      return 0;
    }
    
    const elapsed = Math.floor((Date.now() - this.backgroundStartTime) / 1000);
    this.backgroundStartTime = null;
    console.log(`Background elapsed time: ${elapsed} seconds`);
    return elapsed;
  }

  // バックグラウンドタスク登録
  async registerBackgroundTask(): Promise<void> {
    try {
      // タスク定義
      TaskManager.defineTask(BACKGROUND_TIMER_TASK, ({ data, error }) => {
        if (error) {
          console.error('Background task error:', error);
          return;
        }

        console.log('Background task executed');
        return BackgroundFetch.BackgroundFetchResult.NewData;
      });

      // iOSでバックグラウンドフェッチ登録
      if (Platform.OS === 'ios') {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
          minimumInterval: 15000, // 15秒
          stopOnTerminate: false,
          startOnBoot: false,
        });
      }

      console.log('Background task registered');
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  }

  // バックグラウンドタスク解除
  async unregisterBackgroundTask(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
      console.log('Background task unregistered');
    } catch (error) {
      console.error('Failed to unregister background task:', error);
    }
  }

  // 通知送信
  async sendNotification(title: string, body: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // 即座に表示
      });
      console.log('Notification sent:', title);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // クリーンアップ
  async cleanup(): Promise<void> {
    await this.stopKeepAwake();
    await this.unregisterBackgroundTask();
    console.log('BackgroundManager cleaned up');
  }
}

// シングルトンインスタンス
export const backgroundManager = new BackgroundManager();

// 便利関数
export const initializeBackgroundServices = () => {
  backgroundManager.initializeNotifications();
  backgroundManager.registerBackgroundTask();
};

export const startTimerBackground = () => {
  backgroundManager.startKeepAwake();
};

export const stopTimerBackground = () => {
  backgroundManager.stopKeepAwake();
};

export const recordBackgroundStart = () => {
  backgroundManager.recordBackgroundStart();
};

export const getBackgroundElapsedTime = () => {
  return backgroundManager.getBackgroundElapsedTime();
};

export const sendTimerNotification = (title: string, body: string) => {
  backgroundManager.sendNotification(title, body);
};
