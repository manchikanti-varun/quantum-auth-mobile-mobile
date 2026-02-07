import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLayout } from '../hooks/useLayout';
import { theme } from '../constants/theme';

export const FloatingActionButton = ({ onPress }) => {
  const { horizontalPadding, safeBottom } = useLayout();
  const bottom = Math.max(24, safeBottom) + 24;
  return (
    <TouchableOpacity
      style={[styles.wrapper, { right: horizontalPadding, bottom }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={theme.gradients.accent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fab}
      >
        <Text style={styles.icon}>+</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
    color: theme.colors.bg,
    fontWeight: '300',
  },
});
