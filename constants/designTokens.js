/**
 * Design tokens for consistent spacing, radii, and typography across the app.
 * @module constants/designTokens
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  display: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '700' },
  h2: { fontSize: 20, fontWeight: '600' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16 },
  bodySm: { fontSize: 14 },
  caption: { fontSize: 12 },
};

export const touchTarget = 48;
