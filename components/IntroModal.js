/**
 * IntroModal – First-time intro: what QSafe does, how it works.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppLogo } from './AppLogo';
import { useTheme } from '../context/ThemeContext';
import { themeDark } from '../constants/themes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'shield-lock-outline',
    title: 'Quantum-Safe 2FA',
    body: 'Store your authenticator codes in one place. Generate TOTP codes for Google, GitHub, and any service that supports 2FA.',
  },
  {
    icon: 'cellphone-check',
    title: 'Approve logins on your phone',
    body: 'When you sign in on a new device, approve or deny from your phone. No more waiting for SMS codes.',
  },
  {
    icon: 'key-variant',
    title: 'Ready to get started?',
    body: 'Create an account or sign in to manage your 2FA codes and secure your logins.',
  },
];

export const IntroModal = ({ visible, onComplete }) => {
  const { theme } = useTheme();
  const [index, setIndex] = useState(0);
  const flatRef = useRef(null);

  if (!visible) return null;

  const onNext = () => {
    if (index < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      onComplete?.();
    }
  };

  const onSkip = () => {
    onComplete?.();
  };

  const onScroll = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (i !== index) setIndex(i);
  };

  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <MaterialCommunityIcons name={item.icon} size={48} color={theme.colors.accent} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{item.body}</Text>
    </View>
  );

  return (
    <LinearGradient colors={theme.gradients.hero} style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip} hitSlop={16}>
        <Text style={[styles.skipText, { color: theme.colors.textMuted }]}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.logoRow}>
        <AppLogo size="md" />
        <Text style={[styles.brand, { color: theme.colors.text }]}>QSafe</Text>
      </View>

      <FlatList
        ref={flatRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(i) => i.icon}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === index ? theme.colors.accent : theme.colors.textMuted },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {index === SLIDES.length - 1 ? 'Get started' : 'Next'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={themeDark.colors.bg} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 48,
    right: themeDark.spacing.lg,
    zIndex: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: themeDark.spacing.sm,
    marginBottom: themeDark.spacing.xl,
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: themeDark.spacing.xxl,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: themeDark.spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: themeDark.spacing.md,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: themeDark.spacing.xl,
    paddingBottom: themeDark.spacing.xxl + 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: themeDark.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttonWrapper: {
    borderRadius: themeDark.radii.lg,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: themeDark.spacing.sm,
    paddingVertical: themeDark.spacing.lg,
    paddingHorizontal: themeDark.spacing.xxl,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: themeDark.colors.bg,
  },
});
