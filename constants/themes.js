/**
 * Light and dark theme definitions. Colors, gradients, typography, shadows.
 * @module constants/themes
 */
const baseTypo = {
  display: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16 },
  bodySm: { fontSize: 14 },
  caption: { fontSize: 12 },
  mono: { fontFamily: 'monospace' },
};

const baseSpacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const baseRadii = { xs: 8, sm: 10, md: 14, lg: 18, xl: 24, xxl: 32, full: 9999 };

export const themeDark = {
  colors: {
    bg: '#0c0f14',
    bgElevated: '#12171f',
    bgCard: '#181f2a',
    surface: '#1e2938',
    surfaceBright: '#273544',
    border: 'rgba(255, 255, 255, 0.08)',
    borderBright: 'rgba(255, 255, 255, 0.14)',
    accent: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.45)',
    accentMuted: '#7dd3fc',
    violet: '#a78bfa',
    success: '#34d399',
    successDark: '#10b981',
    error: '#f87171',
    warning: '#fbbf24',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    overlay: 'rgba(0,0,0,0.5)',
    onAccent: '#0f172a',
  },
  gradients: {
    accent: ['#38bdf8', '#0ea5e9'],
    violet: ['#8b5cf6', '#a78bfa'],
    hero: ['#12171f', '#0c0f14'],
  },
  spacing: baseSpacing,
  radii: baseRadii,
  typography: baseTypo,
  shadow: {
    glow: { shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12 },
    glowSubtle: { shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
    cardSoft: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
    cardSubtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
    button: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  },
};

export const themeLight = {
  colors: {
    bg: '#f1f5f9',
    bgElevated: '#ffffff',
    bgCard: '#ffffff',
    surface: '#e2e8f0',
    surfaceBright: '#cbd5e1',
    border: 'rgba(0, 0, 0, 0.08)',
    borderBright: 'rgba(0, 0, 0, 0.14)',
    accent: '#0ea5e9',
    accentGlow: 'rgba(14, 165, 233, 0.4)',
    accentMuted: '#38bdf8',
    violet: '#7c3aed',
    success: '#059669',
    successDark: '#047857',
    error: '#dc2626',
    warning: '#d97706',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    overlay: 'rgba(0,0,0,0.5)',
    onAccent: '#0f172a',
  },
  gradients: {
    accent: ['#0ea5e9', '#38bdf8'],
    violet: ['#8b5cf6', '#a78bfa'],
    hero: ['#e2e8f0', '#cbd5e1'],
  },
  spacing: baseSpacing,
  radii: baseRadii,
  typography: baseTypo,
  shadow: {
    glow: { shadowColor: '#0284c7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
    glowSubtle: { shadowColor: '#0284c7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    cardSoft: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    cardSubtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  },
};
