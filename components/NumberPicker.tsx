import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../utils/colors';

interface NumberPickerProps {
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
  step?: number;
}

export default function NumberPicker({
  value,
  min,
  max,
  onValueChange,
  step = 1,
}: NumberPickerProps) {
  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onValueChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onValueChange(newValue);
  };

  const isIncrementDisabled = value >= max;
  const isDecrementDisabled = value <= min;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          styles.decrementButton,
          isDecrementDisabled && styles.disabledButton,
        ]}
        onPress={handleDecrement}
        disabled={isDecrementDisabled}
      >
        <Text style={[
          styles.buttonText,
          isDecrementDisabled && styles.disabledButtonText,
        ]}>
          -
        </Text>
      </TouchableOpacity>

      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          styles.incrementButton,
          isIncrementDisabled && styles.disabledButton,
        ]}
        onPress={handleIncrement}
        disabled={isIncrementDisabled}
      >
        <Text style={[
          styles.buttonText,
          isIncrementDisabled && styles.disabledButtonText,
        ]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBlue,
  },
  decrementButton: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  incrementButton: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  disabledButton: {
    backgroundColor: Colors.inactiveGray,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#8E8E93',
  },
  valueContainer: {
    width: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardWhite,
  },
  valueText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textBlack,
  },
});
