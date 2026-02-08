/**
 * IntroModal – Modern onboarding with clear value proposition.
 */
import React, { useState, useRef, useEffect } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../constants/designTokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'shield-account-outline',
    title: 'All your 2FA codes in one place',
    body: 'Store codes for Google, GitHub, and any service. Tap to copy and sign in.',
  },
  {
    icon: 'cellphone-link',
    title: 'Approve logins from your phone',
    body: 'New device? Approve or deny from here. No SMS needed.',
  },
  {
    icon: 'rocket-launch-outline',
    title: 'Let\'s get started',
    body: 'Create an account or sign in to secure your logins.',
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

  const onSkip = () => onComplete?.();

  const onScroll = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (i !== index) setIndex(i);
  };

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onNext, 3500);
    return () => clearTimeout(timer);
  }, [visible, index]);

  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.bgCard, borderWidth: 2, borderColor: theme.colors.border }]}>
        <MaterialCommunityIcons name={item.icon} size={56} color={theme.colors.accent} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{item.body}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip} hitSlop={20}>
        <Text style={[styles.skipText, { color: theme.colors.textMuted }]}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.brandRow}>
        <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoBox}>
          <MaterialCommunityIcons name="shield-check" size={28} color="#0f172a" />
        </LinearGradient>
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
                i === index && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.buttonWrapper} onPress={onNext} activeOpacity={0.9}>
          <LinearGradient
            colors={theme.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {index === SLIDES.length - 1 ? 'Get started' : 'Next'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={22} color="#0f172a" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 44,
    right: spacing.lg,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 30,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + 32,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.5,
  },
  dotActive: {
    width: 24,
    opacity: 1,
  },
  buttonWrapper: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
});
