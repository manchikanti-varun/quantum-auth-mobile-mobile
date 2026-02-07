/**
 * QSafe — Dark and Light theme variants
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
const baseRadii = { xs: 6, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, full: 9999 };

export const themeDark = {
  colors: {
    bg: '#05070d',
    bgElevated: '#0a0e16',
    bgCard: '#0d1119',
    surface: '#131a24',
    surfaceBright: '#1a2332',
    border: 'rgba(0, 229, 255, 0.12)',
    borderBright: 'rgba(0, 229, 255, 0.25)',
    accent: '#00e5ff',
    accentGlow: 'rgba(0, 229, 255, 0.5)',
    accentMuted: '#22d3ee',
    violet: '#a78bfa',
    success: '#10b981',
    successDark: '#059669',
    error: '#f43f5e',
    warning: '#f59e0b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
  },
  gradients: {
    accent: ['#00e5ff', '#22d3ee'],
    violet: ['#7c3aed', '#a78bfa'],
    hero: ['#0a0e16', '#05070d'],
  },
  spacing: baseSpacing,
  radii: baseRadii,
  typography: baseTypo,
  shadow: {
    glow: { shadowColor: '#00e5ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
    glowSubtle: { shadowColor: '#00e5ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8 },
    button: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  },
};

export const themeLight = {
  colors: {
    bg: '#f8fafc',
    bgElevated: '#ffffff',
    bgCard: '#f1f5f9',
    surface: '#e2e8f0',
    surfaceBright: '#cbd5e1',
    border: 'rgba(0, 149, 255, 0.2)',
    borderBright: 'rgba(0, 149, 255, 0.35)',
    accent: '#0891b2',
    accentGlow: 'rgba(8, 145, 178, 0.4)',
    accentMuted: '#06b6d4',
    violet: '#7c3aed',
    success: '#059669',
    successDark: '#047857',
    error: '#dc2626',
    warning: '#d97706',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
  },
  gradients: {
    accent: ['#0891b2', '#06b6d4'],
    violet: ['#7c3aed', '#a78bfa'],
    hero: ['#f1f5f9', '#e2e8f0'],
  },
  spacing: baseSpacing,
  radii: baseRadii,
  typography: baseTypo,
  shadow: {
    glow: { shadowColor: '#0891b2', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  },
};
