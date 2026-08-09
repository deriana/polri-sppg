import React, { createContext, useContext, useState } from 'react';
import {
  lightColors,
  darkColors,
  fontSize,
  iconSize,
  iconStrokeWidth,
  radius,
  shadowLight,
  shadowDark,
  spacing,
  type,
} from '../theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  gold: string;
  pastelBlue: string;
  background: string;
  surface: string;
  card: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textInverse: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  problem: string;
  problemBg: string;
  info: string;
  infoBg: string;
  glassBackground: string;
  glassBorder: string;
}

export const lightThemeColors: ThemeColors = {
  ...lightColors,
  card: lightColors.surface,
  glassBackground: 'rgba(255, 255, 255, 0.92)',
  glassBorder: 'rgba(226, 232, 240, 0.8)',
};

export const darkThemeColors: ThemeColors = {
  ...darkColors,
  card: darkColors.surface,
  glassBackground: 'rgba(14, 42, 85, 0.92)',
  glassBorder: 'rgba(44, 78, 130, 0.8)',
};

export interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  statusColors: Record<string, string>;
  statusBg: Record<string, string>;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadowLight | typeof shadowDark;
  type: typeof type;
  fontSize: typeof fontSize;
  iconSize: typeof iconSize;
  iconStrokeWidth: typeof iconStrokeWidth;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

// Status semantics for SIGAP SPPG: normal (Aman) / perhatian (Perlu Perhatian) / emergency (Darurat)
const getStatusColors = (c: ThemeColors) => ({
  normal: c.success,
  perhatian: c.warning,
  emergency: c.danger,
});

const getStatusBg = (c: ThemeColors) => ({
  normal: c.successBg,
  perhatian: c.warningBg,
  emergency: c.dangerBg,
});

const defaultThemeValue: ThemeContextType = {
  theme: 'light',
  isDark: false,
  colors: lightThemeColors,
  statusColors: getStatusColors(lightThemeColors),
  statusBg: getStatusBg(lightThemeColors),
  spacing,
  radius,
  shadow: shadowLight,
  type,
  fontSize,
  iconSize,
  iconStrokeWidth,
  toggleTheme: () => {},
  setTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeValue);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  const isDark = theme === 'dark';
  const colors = isDark ? darkThemeColors : lightThemeColors;
  const shadow = isDark ? shadowDark : shadowLight;
  const statusColors = getStatusColors(colors);
  const statusBg = getStatusBg(colors);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const contextValue: ThemeContextType = {
    theme,
    isDark,
    colors,
    statusColors,
    statusBg,
    spacing,
    radius,
    shadow,
    type,
    fontSize,
    iconSize,
    iconStrokeWidth,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext) || defaultThemeValue;
}
