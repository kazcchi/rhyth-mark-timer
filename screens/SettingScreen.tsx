import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../App';

import NumberPicker from '../components/NumberPicker';
import { useSettings } from '../utils/SettingsContext';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { settings, updateSettings } = useSettings();

  // ローカル設定値の状態管理
  const [workMinutes, setWorkMinutes] = useState(settings.workMinutes);
  const [workSeconds, setWorkSeconds] = useState(settings.workSeconds);
  const [restMinutes, setRestMinutes] = useState(settings.restMinutes);
  const [restSeconds, setRestSeconds] = useState(settings.restSeconds);
  const [rounds, setRounds] = useState(settings.rounds);

  // 現在の設定値をローカル状態に反映
  useEffect(() => {
    setWorkMinutes(settings.workMinutes);
    setWorkSeconds(settings.workSeconds);
    setRestMinutes(settings.restMinutes);
    setRestSeconds(settings.restSeconds);
    setRounds(settings.rounds);
  }, [settings]);

  // 設定保存
  const handleSaveAndBack = async () => {
    // バリデーション
    const workTotal = workMinutes * 60 + workSeconds;
    const restTotal = restMinutes * 60 + restSeconds;

    if (workTotal === 0) {
      Alert.alert('Invalid Settings', 'Work time must be greater than 0 seconds.');
      return;
    }

    if (restTotal === 0) {
      Alert.alert('Invalid Settings', 'Rest time must be greater than 0 seconds.');
      return;
    }

    try {
      // 設定をContextに保存
      await updateSettings({
        workMinutes,
        workSeconds,
        restMinutes,
        restSeconds,
        rounds,
      });

      Alert.alert('Settings Saved', 'Timer settings have been updated!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Work Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Time</Text>
          <View style={styles.timePickerContainer}>
            <View style={styles.pickerGroup}>
              <Text style={styles.pickerLabel}>Minutes</Text>
              <NumberPicker
                value={workMinutes}
                min={0}
                max={60}
                onValueChange={setWorkMinutes}
              />
            </View>
            
            <View style={styles.pickerGroup}>
              <Text style={styles.pickerLabel}>Seconds</Text>
              <NumberPicker
                value={workSeconds}
                min={0}
                max={59}
                onValueChange={setWorkSeconds}
              />
            </View>
          </View>
        </View>

        {/* Rest Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rest Time</Text>
          <View style={styles.timePickerContainer}>
            <View style={styles.pickerGroup}>
              <Text style={styles.pickerLabel}>Minutes</Text>
              <NumberPicker
                value={restMinutes}
                min={0}
                max={60}
                onValueChange={setRestMinutes}
              />
            </View>
            
            <View style={styles.pickerGroup}>
              <Text style={styles.pickerLabel}>Seconds</Text>
              <NumberPicker
                value={restSeconds}
                min={0}
                max={59}
                onValueChange={setRestSeconds}
              />
            </View>
          </View>
        </View>

        {/* Rounds Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rounds</Text>
          <View style={styles.roundsContainer}>
            <NumberPicker
              value={rounds}
              min={1}
              max={10}
              onValueChange={setRounds}
            />
          </View>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timer Preview</Text>
          <View style={styles.previewContainer}>
            <Text style={styles.previewText}>
              Work: {workMinutes}:{workSeconds.toString().padStart(2, '0')}
            </Text>
            <Text style={styles.previewText}>
              Rest: {restMinutes}:{restSeconds.toString().padStart(2, '0')}
            </Text>
            <Text style={styles.previewText}>
              Rounds: {rounds}
            </Text>
            <Text style={styles.previewText}>
              Total Time: {Math.floor(((workMinutes * 60 + workSeconds) + 
                           (restMinutes * 60 + restSeconds)) * rounds / 60)}:
              {(((workMinutes * 60 + workSeconds) + 
                 (restMinutes * 60 + restSeconds)) * rounds % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveAndBack}
        >
          <Text style={styles.saveButtonText}>Save & Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pickerGroup: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 10,
  },
  roundsContainer: {
    alignItems: 'center',
  },
  previewContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 15,
  },
  previewText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 5,
    fontFamily: 'System',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#F2F2F2',
  },
  saveButton: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
