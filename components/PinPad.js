import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { themeDark } from '../constants/themes';

const NUMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

export const PinPad = ({ onComplete, onCancel, title = 'Enter PIN', mode = 'verify', minLength = 4 }) => {
  const { theme } = useTheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(mode === 'setup' ? 'enter' : 'verify');
  const [error, setError] = useState('');
  const len = mode === 'setup' ? Math.max(minLength, 6) : minLength;

  const handlePress = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    if (key === 'back') {
      if (step === 'confirm') {
        setConfirmPin((c) => c.slice(0, -1));
      } else {
        setPin((p) => p.slice(0, -1));
      }
      return;
    }
    if (key === '') return;

    if (step === 'confirm') {
      const next = confirmPin + key;
      setConfirmPin(next);
      if (next.length >= len) {
        if (next === pin) {
          onComplete?.(pin);
        } else {
          setError('PINs do not match');
          setConfirmPin('');
        }
      }
    } else {
      const next = pin + key;
      setPin(next);
      if (mode === 'verify') {
        if (next.length >= len) {
          onComplete?.(next);
        }
      } else if (mode === 'setup' && next.length >= len) {
        setStep('confirm');
        setConfirmPin('');
      }
    }
  };

  const dots = step === 'confirm' ? confirmPin.length : pin.length;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {step === 'confirm' ? 'Confirm PIN' : title}
      </Text>
      {error ? (
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
      ) : null}
      <View style={styles.dotsRow}>
        {Array.from({ length: len }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < dots ? theme.colors.accent : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.keypad}>
        {NUMS.map((key, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.key, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => handlePress(key)}
            disabled={key === ''}
          >
            {key === 'back' ? (
              <MaterialCommunityIcons name="backspace-outline" size={24} color={theme.colors.textMuted} />
            ) : (
              <Text style={[styles.keyText, { color: theme.colors.text }]}>{key}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {onCancel && (
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: theme.colors.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...themeDark.typography.h2,
    marginBottom: themeDark.spacing.md,
  },
  error: {
    fontSize: 14,
    marginBottom: themeDark.spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: themeDark.spacing.xl,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    gap: 12,
    justifyContent: 'center',
  },
  key: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: themeDark.spacing.xl,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
