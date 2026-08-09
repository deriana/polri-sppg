// SIGAP SPPG Brand Color Tokens & Dynamic Theme Specification
// Official Polri & BGN (Badan Gizi Nasional) Civic Command Palette:
// Deep Indigo Navy (#0B2240), Burnished Gold (#C89422), Slate Canvas (#F3F6FA),
// Teal Emerald (#0D9488), Sky Azure (#0284C7), Crimson Rose (#E11D48).

export const lightColors = {
  primary: '#0B2240', // Deep Indigo Commander Navy
  primaryDark: '#061326', // Deeper pressed navy
  primaryLight: '#EDF4FC', // Soft Sky Ice Tint
  gold: '#C89422', // Burnished Gold Accent
  goldLight: '#FAF4E6', // Soft Gold Tint
  pastelBlue: '#80BCEE', // Pastel Sky
  background: '#F3F6FA', // Light Slate Canvas (Default Light Mode)
  surface: '#FFFFFF', // Pure White Surface
  card: '#FFFFFF', // Card Surface
  border: '#E0E6ED', // Hairline Border
  borderStrong: '#CBD5E1', // Slate 300
  text: '#0F172A', // Slate 900 High Contrast Text
  textMuted: '#64748B', // Slate 500 Subtitle Text
  textInverse: '#FFFFFF', // Inverse Light Text
  success: '#0D9488', // Teal Emerald — Aman / Normal
  successBg: '#E6F4F1',
  warning: '#D97706', // Warm Amber — Perlu Perhatian
  warningBg: '#FEF3C7',
  danger: '#E11D48', // Crimson Rose — Darurat / Emergency
  dangerBg: '#FFE4E6',
  problem: '#475569', // Slate Problem Status
  problemBg: '#F1F5F9',
  info: '#0284C7', // Sky Azure
  infoBg: '#E0F2FE',
  glassBackground: 'rgba(255, 255, 255, 0.92)',
  glassBorder: 'rgba(224, 230, 237, 0.8)',
} as const;

export const darkColors = {
  primary: '#E8B854', // Metallic Gold Accent in Dark Mode
  primaryDark: '#BE9234',
  primaryLight: 'rgba(232, 184, 84, 0.16)',
  gold: '#E8B854',
  goldLight: 'rgba(232, 184, 84, 0.16)',
  pastelBlue: '#38BDF8',
  background: '#0B1324', // Deep Space Midnight Navy Background
  surface: '#132036', // Deep Elevated Surface
  card: '#132036',
  border: '#1E314F', // Deep Border Hairline
  borderStrong: '#2D4873',
  text: '#F8FAFC', // Crisp Slate 50 Light Text
  textMuted: '#94A3B8', // Muted Slate Text
  textInverse: '#0B1324', // Inverse Dark Text
  success: '#34D399', // Emerald Green 400
  successBg: 'rgba(52, 211, 153, 0.16)',
  warning: '#FBBF24', // Amber 400
  warningBg: 'rgba(251, 191, 36, 0.16)',
  danger: '#FB7185', // Rose 400
  dangerBg: 'rgba(251, 113, 133, 0.16)',
  problem: '#94A3B8',
  problemBg: 'rgba(148, 163, 184, 0.16)',
  info: '#38BDF8', // Sky 400
  infoBg: 'rgba(56, 189, 248, 0.16)',
  glassBackground: 'rgba(19, 32, 54, 0.90)',
  glassBorder: 'rgba(30, 49, 79, 0.8)',
} as const;

export type ColorPalette = typeof lightColors;

export const colors: ColorPalette = lightColors;

// Status semantics: normal (Aman) / perhatian (Perlu Perhatian) / emergency (Darurat)
export const getStatusColors = (c: { success: string; warning: string; danger: string }) => ({
  normal: c.success,
  perhatian: c.warning,
  emergency: c.danger,
});

export const getStatusBg = (c: { successBg: string; warningBg: string; dangerBg: string }) => ({
  normal: c.successBg,
  perhatian: c.warningBg,
  emergency: c.dangerBg,
});

export const statusColors = getStatusColors(lightColors);
export const statusBg = getStatusBg(lightColors);

export const statusLabel = {
  normal: 'Normal',
  perhatian: 'Perlu Perhatian',
  emergency: 'Darurat',
} as const;

// 4/8px spacing grid
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Modern smooth corner radiuses
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

// Strict typographic scale: Display / H1 / H2 / H3 / Body / BodyStrong / Label / Caption
export const type = {
  display: { fontSize: 32, fontWeight: '800' as const, lineHeight: 38 },
  h1: { fontSize: 24, fontWeight: '800' as const, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyStrong: { fontSize: 16, fontWeight: '700' as const, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
} as const;

// Legacy numeric scale kept for existing call sites
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

// Multi-layered subtle ambient shadows for high-end feel
export const shadowLight = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.13,
    shadowRadius: 28,
    elevation: 10,
  },
} as const;

export const shadowDark = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 4,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.70,
    shadowRadius: 30,
    elevation: 12,
  },
} as const;

export const shadow = shadowLight;

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const iconStrokeWidth = 1.75;

export { useTheme, ThemeProvider, type ThemeColors, type ThemeMode } from '../context/ThemeContext';

