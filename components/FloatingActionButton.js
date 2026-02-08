/**
 * FloatingActionButton – Add account FAB (Google/Microsoft style).
 */
import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLayout } from '../hooks/useLayout';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../constants/designTokens';

export const FloatingActionButton = ({ onPress }) => {
  const { theme } = useTheme();
  const { horizontalPadding, safeBottom } = useLayout();
  const bottom = Math.max(28, safeBottom) + 28;
  return (
    <TouchableOpacity
      style={[styles.wrapper, { right: horizontalPadding, bottom }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.fabShadow}>
        <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
          <MaterialCommunityIcons name="qrcode-scan" size={28} color="#0f172a" />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
  fabShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#38bdf8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
