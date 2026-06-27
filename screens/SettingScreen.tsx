import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../App';

import NumberPicker from '../components/NumberPicker';
import { useSettings, PRESET_SLOTS } from '../utils/SettingsContext';
import { Colors } from '../utils/colors';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { settings, updateSettings, presets, savePreset } = useSettings();

  // ローカル設定値の状態管理
  const [workMinutes, setWorkMinutes] = useState(settings.workMinutes);
  const [workSeconds, setWorkSeconds] = useState(settings.workSeconds);
  const [restMinutes, setRestMinutes] = useState(settings.restMinutes);
  const [restSeconds, setRestSeconds] = useState(settings.restSeconds);
  const [rounds, setRounds] = useState(settings.rounds);

  // プリセット名の入力欄（未保存スロットは空欄でプレースホルダー表示）
  const [presetNameInputs, setPresetNameInputs] = useState(
    new Array(PRESET_SLOTS).fill('')
  );

  // 現在の設定値をローカル状態に反映
  useEffect(() => {
    setWorkMinutes(settings.workMinutes);
    setWorkSeconds(settings.workSeconds);
    setRestMinutes(settings.restMinutes);
    setRestSeconds(settings.restSeconds);
    setRounds(settings.rounds);
  }, [settings]);

  // プリセット名をローカル入力欄に反映
  useEffect(() => {
    setPresetNameInputs(presets.map((preset) => preset?.name ?? ''));
  }, [presets]);

  const handleLoadPreset = (index: number) => {
    const preset = presets[index];
    if (!preset) return;
    setWorkMinutes(preset.workMinutes);
    setWorkSeconds(preset.workSeconds);
    setRestMinutes(preset.restMinutes);
    setRestSeconds(preset.restSeconds);
    setRounds(preset.rounds);
  };

  const handleSavePreset = async (index: number) => {
    const name = presetNameInputs[index].trim();
    try {
      await savePreset(index, {
        name: name || undefined,
        workMinutes,
        workSeconds,
        restMinutes,
        restSeconds,
        rounds,
      });
      Alert.alert('Preset Saved', `${name || `Preset ${index + 1}`} saved!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save preset. Please try again.');
    }
  };

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

        {/* Presets Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Presets</Text>
          {presets.map((preset, index) => (
            <View key={index} style={styles.presetRow}>
              <TextInput
                style={styles.presetNameInput}
                placeholder={`Preset ${index + 1}`}
                placeholderTextColor="#8E8E93"
                value={presetNameInputs[index]}
                onChangeText={(text) => {
                  const updated = [...presetNameInputs];
                  updated[index] = text;
                  setPresetNameInputs(updated);
                }}
              />
              <Text style={styles.presetSummary}>
                {preset
                  ? `${preset.workMinutes}:${preset.workSeconds.toString().padStart(2, '0')} / ${preset.restMinutes}:${preset.restSeconds.toString().padStart(2, '0')} ×${preset.rounds}`
                  : 'Empty'}
              </Text>
              <View style={styles.presetButtonGroup}>
                <TouchableOpacity
                  style={[styles.presetButton, styles.loadPresetButton, !preset && styles.disabledPresetButton]}
                  disabled={!preset}
                  onPress={() => handleLoadPreset(index)}
                >
                  <Text style={styles.presetButtonText}>Load</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, styles.savePresetButton]}
                  onPress={() => handleSavePreset(index)}
                >
                  <Text style={styles.presetButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: Colors.cardWhite,
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
    color: Colors.textBlack,
    marginBottom: 15,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  presetNameInput: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textBlack,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 4,
    marginRight: 8,
  },
  presetSummary: {
    flex: 1.4,
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 8,
  },
  presetButtonGroup: {
    flexDirection: 'row',
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 6,
  },
  loadPresetButton: {
    backgroundColor: Colors.primaryBlue,
  },
  savePresetButton: {
    backgroundColor: Colors.successGreen,
  },
  disabledPresetButton: {
    backgroundColor: Colors.inactiveGray,
  },
  presetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 15,
  },
  previewText: {
    fontSize: 16,
    color: Colors.textBlack,
    marginBottom: 5,
    fontFamily: 'System',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.background,
  },
  saveButton: {
    backgroundColor: Colors.black,
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
