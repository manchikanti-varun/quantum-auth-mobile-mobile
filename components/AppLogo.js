import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const LOGO = require('../assets/icon.png');

/**
 * Reusable QSafe app logo. Use size="sm" | "md" | "lg" for different contexts.
 */
export const AppLogo = ({ size = 'md', style }) => {
  const { container, image } = sizes[size];
  return (
    <View style={[styles.container, container, style]}>
      <Image source={LOGO} style={[styles.image, image]} resizeMode="contain" />
    </View>
  );
};

const sizes = {
  sm: { container: { width: 36, height: 36 }, image: { width: 28, height: 28 } },
  md: { container: { width: 56, height: 56 }, image: { width: 44, height: 44 } },
  lg: { container: { width: 88, height: 88 }, image: { width: 72, height: 72 } },
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 44,
    height: 44,
  },
});
