/**
 * QSafe — Future-Gen Quantum Theme
 * Deep space aesthetic with electric accents
 */
export const theme = {
  colors: {
    bg: '#05070d',
    bgElevated: '#0a0e16',
    bgCard: '#0d1119',
    bgCardHover: '#111720',
    surface: '#131a24',
    border: 'rgba(0, 229, 255, 0.12)',
    borderBright: 'rgba(0, 229, 255, 0.25)',
    accent: '#00e5ff',
    accentMuted: '#22d3ee',
    accentGlow: 'rgba(0, 229, 255, 0.4)',
    violet: '#a78bfa',
    violetMuted: '#7c3aed',
    success: '#10b981',
    successGlow: 'rgba(16, 185, 129, 0.3)',
    error: '#f43f5e',
    warning: '#f59e0b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
  },
  gradients: {
    accent: ['#00e5ff', '#22d3ee'],
    violet: ['#7c3aed', '#a78bfa'],
    card: ['rgba(13, 17, 25, 0.9)', 'rgba(10, 14, 22, 0.95)'],
    hero: ['#0a0e16', '#05070d'],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    display: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
    h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '600' },
    body: { fontSize: 16 },
    bodySm: { fontSize: 14 },
    caption: { fontSize: 12 },
    mono: { fontFamily: 'monospace' },
  },
  shadow: {
    glow: {
      shadowColor: '#00e5ff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};
