// SIGAP SPPG Brand Color Tokens & Dynamic Theme Specification
// Palette resmi Badan Gizi Nasional (BGN): biru gelap #071e49, hijau #92d05d,
// biru pastel #b5e0ea, emas #d1b06c (sumber: bgn.go.id/logo-meaning).
// success/info sedikit digelapkan dari warna resmi agar kontras teks tetap
// aman (WCAG AA) di atas latar terang — hue tetap sama, bukan warna lain.

export const lightColors = {
  primary: '#071e49', // BGN Biru Gelap
  primaryDark: '#04122F', // Shading lebih gelap untuk pressed state
  primaryLight: '#E3F2F8', // Tint lembut dari Biru Pastel BGN
  gold: '#D1B06C', // BGN Emas — badge/highlight
  pastelBlue: '#B5E0EA', // BGN Biru Muda Pastel
  background: '#F7FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  text: '#071E49', // BGN Biru Gelap dipakai sebagai warna teks utama
  textMuted: '#5B6B85',
  textInverse: '#FFFFFF',
  success: '#4C9A3A', // BGN Hijau, digelapkan agar aman jadi warna teks — Normal/Aman
  successBg: '#EAF7E3',
  warning: '#F59E0B', // Amber standar — Perlu Perhatian (semantik keselamatan universal)
  warningBg: '#FFFBEB',
  danger: '#DC2626', // Merah standar — Emergency/Darurat (semantik keselamatan universal)
  dangerBg: '#FEF2F2',
  problem: '#5B6B85',
  problemBg: '#EEF2F7',
  info: '#2E86AB', // BGN Biru Pastel, digelapkan agar aman jadi warna teks
  infoBg: '#E3F5FA',
} as const;

export const darkColors = {
  primary: '#D1B06C', // BGN Emas — pop di atas latar biru gelap
  primaryDark: '#A8873F',
  primaryLight: 'rgba(209, 176, 108, 0.18)',
  gold: '#D1B06C',
  pastelBlue: '#B5E0EA',
  background: '#071E49', // BGN Biru Gelap dipakai langsung sebagai latar dark mode
  surface: '#0E2A55',
  border: '#1C3A66',
  borderStrong: '#2C4E82',
  text: '#FFFFFF',
  textMuted: '#9FB3D1',
  textInverse: '#071E49',
  success: '#92D05D', // BGN Hijau asli — kontras cukup di atas latar gelap
  successBg: 'rgba(146, 208, 93, 0.18)',
  warning: '#FBBF24',
  warningBg: 'rgba(251, 191, 36, 0.18)',
  danger: '#F87171',
  dangerBg: 'rgba(248, 113, 113, 0.18)',
  problem: '#9FB3D1',
  problemBg: 'rgba(159, 179, 209, 0.18)',
  info: '#7DD3FC',
  infoBg: 'rgba(125, 211, 252, 0.18)',
} as const;

export type ColorPalette = typeof lightColors;

export const colors: ColorPalette = lightColors;

// Status semantics for this app: normal (Aman) / perhatian (Perlu Perhatian) / emergency (Darurat)
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

// Smooth radiuses
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
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

// Elevation via a hairline border + shadow for iOS & Android
export const shadowLight = {
  sm: {
    shadowColor: '#071E49',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#071E49',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#071E49',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#071E49',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const shadowDark = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
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
