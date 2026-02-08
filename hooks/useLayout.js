/**
 * Responsive layout hook. Provides dynamic spacing, max widths, safe areas.
 * @module hooks/useLayout
 */

import { useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BREAKPOINTS = { phone: 0, phablet: 400, tablet: 768 };
const CONTENT_MAX_WIDTH = 480;
const HORIZONTAL_PADDING_BASE = 24;
const HORIZONTAL_PADDING_SMALL = 16;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallDevice = width < 380;
  const isTablet = width >= BREAKPOINTS.tablet;
  const isPhablet = width >= BREAKPOINTS.phablet && width < BREAKPOINTS.tablet;

  const horizontalPadding = isSmallDevice ? HORIZONTAL_PADDING_SMALL : HORIZONTAL_PADDING_BASE;
  const contentMaxWidth = Math.min(width - horizontalPadding * 2, CONTENT_MAX_WIDTH);
  const cardMaxWidth = isTablet ? contentMaxWidth : undefined;

  return {
    width,
    height,
    insets,
    isSmallDevice,
    isTablet,
    isPhablet,
    horizontalPadding,
    contentMaxWidth,
    cardMaxWidth,
    safeTop: insets.top,
    safeBottom: insets.bottom,
    safeLeft: insets.left,
    safeRight: insets.right,
  };
}
