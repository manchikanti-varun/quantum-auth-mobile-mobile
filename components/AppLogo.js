/**
 * App logo component. Sizes: sm, md, lg.
 * @module components/AppLogo
 */

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const LOGO = require('../assets/qsafe-logo.png');

export const AppLogo = ({ size = 'md', style }) => {
  const { container, image } = sizes[size];
  return (
    <View style={[styles.container, container, style]}>
      <Image source={LOGO} style={[styles.image, image]} resizeMode="contain" />
    </View>
  );
};

const sizes = {
  sm: { container: { width: 40, height: 40 }, image: { width: 40, height: 40 } },
  md: { container: { width: 64, height: 64 }, image: { width: 64, height: 64 } },
  lg: { container: { width: 96, height: 96 }, image: { width: 96, height: 96 } },
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 64,
    height: 64,
  },
});
