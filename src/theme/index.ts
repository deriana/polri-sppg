// SIGAP SPPG Brand Color Tokens & Dynamic Theme Specification
// Official Polri & BGN (Badan Gizi Nasional) Civic Command Palette:
// Deep Indigo Navy (#0B2240), Burnished Gold (#C89422), Slate Canvas (#F3F6FA),
// Teal Emerald (#0D9488), Sky Azure (#0284C7), Crimson Rose (#E11D48).

export const lightColors = {
  primary: '#2563EB', // Bright Vivid Royal Azure (Replaced dark navy!)
  primaryDark: '#1D4ED8', // Deeper vivid royal blue
  primaryLight: '#EFF6FF', // Soft Sky Tint
  navy: '#0A2342', // Deep Indigo Commander Navy
  accent: '#2563EB', // Vivid Royal Azure
  accentLight: '#EFF6FF', // Soft Royal Tint
  gold: '#D97706', // Burnished Amber Gold Accent
  goldLight: '#FEF3C7', // Soft Gold Tint
  emerald: '#059669', // Rich Emerald Green
  emeraldLight: '#ECFDF5', // Soft Mint Tint
  rose: '#E11D48', // Vivid Crimson Rose
  roseLight: '#FFE4E6', // Soft Rose Tint
  violet: '#7C3AED', // Deep Vivid Violet
  violetLight: '#F5F3FF', // Soft Violet Tint
  cyan: '#0891B2', // Vivid Teal Cyan
  cyanLight: '#ECFEFF',
  pastelBlue: '#60A5FA', // Pastel Sky
  background: '#F1F5F9', // Clean Canvas Slate
  surface: '#FFFFFF', // Pure White Surface
  card: '#FFFFFF', // Card Surface
  border: '#E2E8F0', // Crisp Hairline Border
  borderStrong: '#CBD5E1', // Slate 300
  text: '#0F172A', // Slate 900 High Contrast Text
  textMuted: '#64748B', // Slate 500 Subtitle Text
  textInverse: '#FFFFFF', // Inverse Light Text
  success: '#059669', // Emerald — Aman / Normal
  successBg: '#ECFDF5',
  warning: '#D97706', // Amber Gold — Perlu Perhatian
  warningBg: '#FEF3C7',
  danger: '#E11D48', // Crimson Rose — Darurat / Emergency
  dangerBg: '#FFE4E6',
  problem: '#475569', // Slate Problem Status
  problemBg: '#F1F5F9',
  info: '#2563EB', // Sky Royal Azure
  infoBg: '#EFF6FF',
  glassBackground: 'rgba(255, 255, 255, 0.95)',
  glassBorder: 'rgba(226, 232, 240, 0.9)',
} as const;

export const darkColors = {
  primary: '#38BDF8', // Bright Azure in Dark Mode
  primaryDark: '#0284C7',
  primaryLight: 'rgba(56, 189, 248, 0.18)',
  navy: '#07101E',
  accent: '#38BDF8', // Cyan Azure
  accentLight: 'rgba(56, 189, 248, 0.18)',
  gold: '#FBBF24',
  goldLight: 'rgba(251, 191, 36, 0.18)',
  emerald: '#10B981',
  emeraldLight: 'rgba(16, 185, 129, 0.18)',
  rose: '#FB7185',
  roseLight: 'rgba(251, 113, 133, 0.18)',
  violet: '#A78BFA',
  violetLight: 'rgba(167, 139, 250, 0.18)',
  cyan: '#22D3EE',
  cyanLight: 'rgba(34, 211, 238, 0.18)',
  pastelBlue: '#38BDF8',
  background: '#07101E', // Deep Space Midnight Background
  surface: '#0F1D33', // Deep Elevated Navy Surface
  card: '#0F1D33',
  border: '#1E3250', // Deep Border Hairline
  borderStrong: '#2E4870',
  text: '#F8FAFC', // Crisp Slate 50 Light Text
  textMuted: '#94A3B8', // Muted Slate Text
  textInverse: '#07101E', // Inverse Dark Text
  success: '#10B981', // Emerald Green 400
  successBg: 'rgba(16, 185, 129, 0.18)',
  warning: '#FBBF24', // Amber 400
  warningBg: 'rgba(251, 191, 36, 0.18)',
  danger: '#FB7185', // Rose 400
  dangerBg: 'rgba(251, 113, 133, 0.18)',
  problem: '#94A3B8',
  problemBg: 'rgba(148, 163, 184, 0.18)',
  info: '#38BDF8', // Sky 400
  infoBg: 'rgba(56, 189, 248, 0.18)',
  glassBackground: 'rgba(15, 29, 51, 0.92)',
  glassBorder: 'rgba(30, 50, 80, 0.85)',
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

// Flat, understated shadows — just enough separation from the background, no heavy elevation
export const shadowLight = {
  sm: {
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  md: {
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const shadowDark = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
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

